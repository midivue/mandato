# Mandatoto Scoring System

This document defines how predictions are scored after the 2026 Hungarian parliamentary election results are finalized. The scoring formula is transparent and versioned.

## Version

**Scoring v2** — introduces attendance rate prediction, separates nationalities scoring, and rebalances point weights.

## When Scoring Runs

- Scoring is **not active** before the election. The `score` column in the database remains `NULL` until official results are entered.
- After the election (`2026-04-12`), official final results are prepared as a static dataset and ingested into the system.
- A one-time scoring pass computes every finalized prediction's score and writes it to the `score` column.
- Only predictions with `status = 'finalized'` are scored. Drafts are excluded.

## What Users Predict

Each prediction has five scored components:

| Component | Field | Required to finalize | Description |
|-----------|-------|---------------------|-------------|
| **Party list winner** | `list_winner_id` | Yes | Which party wins the most list votes |
| **5-party percentages** | `pct_{party}` (×5) | All required, must sum to 100% with nationalities | Predicted vote share for each of the 5 qualifying party lists |
| **Nationalities list** | `pct_nationalities` | Yes (part of 100% sum) | Combined nationalities list percentage |
| **Prime minister** | `pm_winner_id` | Yes | Which party's candidate becomes PM |
| **Participation rate** | `participation_rate` | No (default: 70%) | Predicted voter turnout percentage |

The 5 qualifying party lists: MKKP, TISZA, Mi Hazánk, DK, FIDESZ-KDNP. The nationalities list represents all combined nationalities lists (historically ~0.44% in 2022). 

## Scoring Components

The total score is a weighted sum of five components, normalized to a **0–100** scale.

### 1. Percentage Accuracy — 5 parties (70 points)

The core precision component. Measures how close the user's predicted percentages are to the actual results using **mean absolute error (MAE)** across the 5 main party fields (nationalities are excluded here and scored separately).

**Calculation:**

1. For each of the 5 party fields, compute the absolute error:
   `error_i = |predicted_i − actual_i|`
   - If the user left a field blank (`NULL`), the error defaults to the actual result value (worst-case assumption: the user predicted 0%).
2. Compute the mean absolute error across the 5 fields:
   `MAE = (error_1 + … + error_5) / 5`
3. Convert MAE to points. A perfect prediction (MAE = 0) earns full marks; an MAE ≥ 30 earns zero:
   `percentage_points = max(0, 70 × (1 − MAE / 30))`

**Example:**

| Field | Predicted | Actual | Error |
|-------|-----------|--------|-------|
| MKKP | 3.0 | 2.5 | 0.5 |
| TISZA | 45.0 | 42.0 | 3.0 |
| Mi Hazánk | 7.0 | 6.5 | 0.5 |
| DK | 4.0 | 5.0 | 1.0 |
| FIDESZ-KDNP | 34.0 | 38.0 | 4.0 |

MAE = (0.5 + 3.0 + 0.5 + 1.0 + 4.0) / 5 = **1.8**
Points = 70 × (1 − 1.8 / 30) = 70 × 0.94 = **65.8**

### 2. Nationalities List (5 points)

A separate precision bonus for the nationalities list percentage, using a tighter error cap.

**Calculation:**
`nat_points = max(0, 5 × (1 − |predicted − actual| / 0.5))`

The 0.5pp cap means a prediction more than 0.5 percentage points off earns 0 points. This rewards users who pay close attention to this small but distinctive component.

**Example:**
- Predicted: 0.50%, Actual: 0.44%, Error: 0.06pp → 5 × (1 − 0.06/0.5) = **4.4 pts**

### 3. Party List Winner (5 points)

Binary — did the user correctly predict which party wins the most list votes?

| Outcome | Points |
|---------|--------|
| Correct | **5** |
| Incorrect | **0** |

### 4. Prime Minister (10 points)

Binary — did the user correctly predict which party's candidate becomes prime minister?

| Outcome | Points |
|---------|--------|
| Correct | **10** |
| Incorrect | **0** |

### 5. Participation Rate (10 points)

How close was the user's predicted voter turnout to the actual result?

**Calculation:**
`attendance_points = max(0, 10 × (1 − |predicted − actual| / 20))`

The 20pp cap means a prediction more than 20 percentage points off earns 0 points. The default tip is **70%** (the 2022 actual was 69.54%).

**Example:**
- Predicted: 70%, Actual: 68%, Error: 2pp → 10 × (1 − 2/20) = **9.0 pts**

**Backward compatibility**: Existing predictions without a `participation_rate` value (`NULL`) receive `attendance_points = 0`.

## Total Score

```
total = percentage_points + nat_points + list_winner_points + pm_points + attendance_points
```

Range: **0.0 – 100.0**

## Weight Rationale

| Component | Points | Why |
|-----------|--------|-----|
| 5-party percentage accuracy | 70 | The hardest to get right; rewards precision and knowledge |
| Nationalities list | 5 | Small but distinctive — rewards users who notice the detail |
| Party list winner | 5 | Important signal but fairly predictable from polls |
| Prime minister | 10 | High-stakes binary call, usually correlated with list winner |
| Participation rate | 10 | Adds forecasting depth; default 70% is a reasonable prior |

The 70% weight on percentages ensures the leaderboard rewards users who are genuinely precise, not just lucky on binary calls.

## Edge Cases

| Situation | Handling |
|-----------|----------|
| User left a party percentage field blank | Null fields are excluded from the MAE calculation (not counted). If all 5 fields are null, MAE defaults to 30 (zero points). In practice this case does not arise: finalization requires all percentage fields to be non-null. |
| User has no `participation_rate` set | Receives 0 attendance points |
| User's predicted percentages don't sum to 100% | Finalization is blocked — all 6 fields must sum to exactly 100% |
| Multiple users tie on score | Sorted by `finalized_at` (earlier finalization wins the tiebreaker) |
| User is `private` visibility | Scored but excluded from the public leaderboard |
| User is still in `draft` status | Not scored |

## Leaderboard

- Only `public` + `finalized` predictions with a non-null `score` appear on the leaderboard.
- Sorted by `score DESC`, then `finalized_at ASC` (tiebreaker: earlier submission ranks higher).
- Top 3 get visual distinction (gold/silver/bronze badges).
- Users can find their own row highlighted if they are logged in.

## Results Data Source

Official results will be sourced from the National Election Office (valasztas.hu) after the final count is certified. The results dataset is prepared externally and loaded into the system — there is no admin UI for entering results in the current release.

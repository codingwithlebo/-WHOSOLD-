# Round UX contract — Double or Pass

**Status:** Product-approved for Phase 4 UI integration
**Owner:** Owethu Jezile
**Date:** 17 November 2026

This contract defines the player-facing copy, privacy promises and timing
behavior for the Phase 4 round UI. It follows the MVP defaults in the
[implementation plan](IMPLEMENTATION_PLAN.md) and acceptance requirements in
the [PRD](PRD.md).

## Choice screen

### Introduction

> **Double or Pass?**
> Your choice is private. Your group can see how many members have responded,
> but not who chose what. Choices and quiz results stay hidden until the
> scheduled release time.

Show only an aggregate response count, for example **“3 of 5 have answered.”**
Do not show which members have or have not answered, or anyone else's choice
or quiz status before release.

### Pass

> **Pass**
> Skip the quiz. Your choice will not put the fund at risk. Other members'
> choices can still affect the group's outcome.

### Double

> **Double**
> Take one quiz of 5 questions, with 20 seconds per question. Score at least
> 4 correct and the group's virtual fund doubles once. Score 3 or fewer and
> the group loses its fund. If you do not finish the quiz, the group loses its
> fund. Your quiz result stays hidden until release.

Use neutral action labels: **Choose Pass** and **Choose Double**.

## Confirmation and submitted states

Require confirmation before submitting either choice. The confirmation dialog
must state that the choice is final and cannot be changed.

**Pass confirmation**

> **Confirm Pass?**
> You will skip the quiz. This choice is final. Other members' quiz results
> can still affect the group's fund.

Actions: **Confirm Pass** and **Go back**.

**Double confirmation**

> **Confirm Double?**
> You will take one timed quiz. Score at least 4 out of 5 and the group's
> virtual fund doubles once; a lower score or an unfinished quiz means the
> group loses its fund. This choice is final, and your result stays hidden
> until release.

Actions: **Confirm Double** and **Go back**.

After confirmation, lock the choice and show it only to that member:

> **Choice submitted**
> You chose **{Pass / Double}**. You cannot change this choice. Your group
> can see the response count, but not your choice. Results are revealed on
> **{release date and time} SAST**.

## Timing and non-response

- The leader schedules when the choice window opens and closes, and when
  results are released. Use the existing defaults and quick presets: a
  24-hour window by default, with 5-minute and 1-hour options for demos.
- Display scheduled dates and times in **SAST**. Show when the window opens,
  a countdown to close while it is open, and the release date and time after
  a member submits.
- Accept choices only while the window is open. Disable choice actions before
  it opens and after it closes.
- A submitted choice is final; no edits or second submissions.
- At close, a member who did not respond is treated as **Pass**.
- Before the scheduled release time, do not reveal any member's choice,
  quiz completion or result to other members. At release, use the named
  Passed / Doubled and won / Doubled and lost breakdown in the implementation
  plan.

## Acceptance checks

- Pass and Double consequences, quiz rules, privacy and finality are stated
  before a member confirms.
- Canceling confirmation does not submit a choice.
- A successful choice is shown only to its owner and cannot be changed.
- Other members see only the aggregate answered count before release.
- No choice or quiz result is exposed before release; the named breakdown is
  available at release.
- Choices outside the scheduled window are not accepted; missed choices are
  treated as Pass at close.

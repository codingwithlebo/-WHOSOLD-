# WHOSOLD? — Product Requirements Document

**Team:** ChatGPT
**Version:** 0.2 (Checkpoint 1)
**Status:** Draft for review
**Last updated:** 11 November 2026

---

## 1. Overview

**WHOSOLD?** is a group game about trust, nerve and knowing your stuff. A friend group (for example, a cohort group) gets its wishlist funded by a mystery billionaire. On the day before the funds are released, **each member is asked individually, in secret**, whether they want the chance to **double the group's fund** or **pass**.

- **Pass:** you take no risk.
- **Double:** you take a quiz. **Win = the group's fund doubles. Lose = the whole group loses its funding.**

Nobody sees the results straight away. On **funds release day** the group finds out whether its fund is **intact, grown or lost**, and whether its mates "scored for you" or "messed it up".

## 2. Problem & Opportunity

Group decision games work because they create tension between individual temptation and collective outcome. Adding a skill-based quiz makes it more than a coin flip: players choose whether they trust themselves enough to risk everyone's funding. Cohort groups already exist, so the game has a ready-made audience that can play together and argue about it afterwards.

## 3. Goals & Non-Goals

### Goals
- Let a group register together and create one shared wishlist.
- Show the group's total fund, "sponsored" by the mystery billionaire.
- Ask each member individually, in secret, to Double or Pass.
- Run a quiz for every member who chooses Double.
- Hold all results until funds release day, then reveal the outcome.
- Keep a short history of past rounds for bragging rights.

### Non-Goals (initial release)
- Real payments or payouts handled inside the app.
- Public matchmaking with strangers.
- Native mobile apps (responsive web only).
- Progression systems, shops or cosmetics.

## 4. Game Modes

| Mode | Description | Status |
|------|-------------|--------|
| **Group mode** | A group joins, builds a shared wishlist, and its members each choose Double or Pass. A quiz win doubles the fund; a quiz loss wipes it for everyone. | **MVP** (chosen because cohorts already work in groups) |
| **Draw mode** | Individuals enter a draw. Only 5 names are drawn at the end of the week. Each of the 5 takes a quiz: a pass gets the wishlist funded; a fail sends that money into the prize pool, doubling it for the next round. | **Later / to be confirmed** |

The rest of this document describes **Group mode** unless stated otherwise.

## 5. Game Flow & Rules (Group mode)

> **Proposed rules. The Product Owner should confirm the points in Open Questions.**

1. **Group joins.** A group is created (with a group name and a join code) and members join.
2. **Wishlist.** The group builds one shared wishlist (items with a name and price). The total is the group's **fund**.
3. **Billionaire funds.** The mystery billionaire "funds" the wishlist, so the fund is locked in and shown to the group.
4. **Play window opens the day before funds release.** Each member is asked **individually and privately**: *Double or Pass?*
5. **Pass** ends the member's turn. No quiz, no risk.
6. **Double** sends the member to a quiz. Each member's quiz result stays hidden.
7. **Resolution** happens once the window closes:
   - **Anyone who took the quiz lost:** the **whole group loses its funding** (fund = R0).
   - **No losses, at least one win:** the fund is **doubled** (once, not once per winner, unless the Product Owner decides otherwise).
   - **Everyone passed:** the fund **stays intact**.
8. **Release day reveal.** The group sees the outcome (intact, grown or lost) and a breakdown of how it happened.
9. The round is saved to each member's history.

**Non-responders** (members who don't answer before the window closes) are treated as **Pass**.

## 6. User Stories

### Group setup
- As a **Group Leader**, I want to create a group and get a join code so that my mates can join.
- As a **Member**, I want to join my group with a code so that I'm part of the funding.
- As a **Group Leader**, I want to lock the group once everyone has joined so that nobody can sneak in later.

### Wishlist & fund
- As a **Member**, I want to add items to the group wishlist so that we ask for what we actually want.
- As a **Member**, I want to see the group's total fund so that I know what is at stake.

### Double or Pass
- As a **Member**, I want to choose Double or Pass privately so that nobody can pressure me.
- As a **Member**, I want to see that my mates have answered (but not what they chose) so that I know where the group stands.

### Quiz
- As a **Member who chose Double**, I want a fair quiz I can take once so that my result is believable.
- As a **Member**, I want to know the rules up front (questions, time limit, pass mark) so that I can decide with full information.

### Reveal
- As a **Member**, I want to find out on release day whether our fund is intact, grown or lost so that the suspense is real.
- As a **Member**, I want to see the breakdown of results so that I know who scored and who messed it up.

### History
- As a **Member**, I want to see past rounds so that I can compare results with my friends.

## 7. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Create a group with a name and a unique join code | Must |
| FR-2 | Join a group by code with a display name | Must |
| FR-3 | Shared group wishlist (add, edit, remove items with a virtual price) | Must |
| FR-4 | Calculate and display the group fund total | Must |
| FR-5 | Scheduled **play window** that opens the day before release day and closes at a set time | Must |
| FR-6 | Individual, private Double/Pass choice, stored server-side and hidden from other members | Must |
| FR-7 | Quiz for members who choose Double (question bank, one attempt, timed) | Must |
| FR-8 | Quiz answers and scoring checked on the server, with the correct answers never sent to the browser early | Must |
| FR-9 | Resolve the group outcome on the server using the rules in section 5 | Must |
| FR-10 | Hide all results until release day, then show the reveal screen with a breakdown | Must |
| FR-11 | Lock choices once submitted (no changes, no quiz retakes) | Must |
| FR-12 | Default non-responders to Pass when the window closes | Should |
| FR-13 | Notifications or reminders when the window opens and when results are ready | Should |
| FR-14 | Round history per member and per group | Should |
| FR-15 | Draw mode (5 winners, quiz, prize pool) | Could |
| FR-16 | Reveal animations and sound effects | Could |

## 8. Non-Functional Requirements

- **Fairness & integrity:** choices, quiz answers and outcomes are all resolved on the server. A member must not be able to see anyone else's choice or result before release day, including through the network inspector.
- **Anti-cheating (quiz):** one attempt, timer enforced by the server, questions served one at a time, answers never exposed to the client.
- **Scheduling:** the play window and release day use a single timezone (SAST), and the server decides when they open and close.
- **Performance:** screens update within 2 seconds of an action.
- **Responsiveness:** works on phones from 360px wide, plus desktop.
- **Accessibility:** WCAG 2.1 AA targets, including contrast, keyboard navigation and screen-reader labels.
- **Security:** validated inputs, rate-limited join and create endpoints, minimal personal data.
- **Reliability:** a dropped connection lets a member resume their place (and their quiz timer keeps running).
- **Responsible design:** the in-app fund is virtual currency, and the app makes clear it is a game.

## 9. Proposed Technical Approach

> **Proposed, to be confirmed by the Tech Lead.**

| Layer | Proposal |
|-------|----------|
| Frontend | React + TypeScript (Vite), Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database & realtime | Supabase (Postgres + Realtime) |
| Scheduling | Scheduled job (e.g. Supabase cron or a Node scheduler) to open and close the play window and trigger reveal |
| CI/CD | GitHub Actions; deployment target to be decided by DevOps |
| Testing | Vitest/Jest for unit tests, Playwright for end-to-end tests |

**Key design points:** the server stores each choice and quiz result but only releases them at reveal; the outcome is computed from stored results in one place so it can be tested thoroughly.

## 10. Team & Roles

See the **Team & Roles** table in the [README](../README.md).

## 11. MVP Scope & Milestones

| Milestone | Description |
|-----------|-------------|
| **Checkpoint 1 — 11 Nov 2026** | Public repo, protected `main`, CI, PRD and README merged |
| **MVP** | Group creation and joining, wishlist, play window, Double/Pass, quiz, server-side resolution, release-day reveal |
| **Polish** | Reveal animations, history, notifications, accessibility pass, QA sign-off |
| **Later** | Draw mode |

Exact dates for later milestones will be added once the schedule is confirmed.

## 12. Success Metrics

- A group can go from creation to a completed round (wishlist, choices, quiz, reveal) without errors.
- No choice or quiz result is visible before release day (verified by tests).
- Quiz answers cannot be read or replayed from the browser (verified by tests).
- 0 critical bugs open at release.
- CI passes on every merged pull request.

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| A draw with real money at stake could fall under gambling or lottery rules | Keep the in-app fund virtual; get advice before any real sponsor funding is tied to the game |
| Members cheat on the quiz (search, share answers, replay) | Timed, single-attempt, server-checked quiz; randomised question order |
| Peer pressure or friction if one member's loss wipes the group | Keep choices secret, reveal only on release day, keep the tone playful |
| Scheduling bugs (window opens or closes at the wrong time) | Single server-side clock and timezone; test the schedule explicitly |
| Small team and tight timeline | Keep the MVP to Group mode; cut "Could" items first |
| Unclear rules cause disputes | Confirm the rules in section 5 before building |

## 14. Open Questions

1. **Multiple winners:** if several members double and all win, does the fund double once or stack (x2, x4, ...)? The proposal is once.
2. **Quiz content:** who writes the questions, what topics, how many questions, what pass mark, and what time limit?
3. **Difficulty:** is the quiz the same for everyone, or does it depend on the size of the fund?
4. **Reveal detail:** on release day, are members named ("Lerato lost it for you") or is the breakdown anonymous?
5. **Real vs virtual:** is the "billionaire" funding real (a sponsor) or fictional and virtual?
6. **Group size:** what is the minimum and maximum members per group?
7. **Play window length:** does it run for a full day, or a set number of hours?
8. **Accounts:** do members sign up, or is a display name and join code enough?
9. **Draw mode:** is it kept for later, and does the prize pool roll over between weeks?
10. **QA ownership:** who is taking the QA/Test Lead responsibilities?

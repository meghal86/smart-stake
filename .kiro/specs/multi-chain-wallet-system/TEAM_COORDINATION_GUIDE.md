# Team Coordination Guide - 4 Person Team

## 👥 TEAM ROLES

### Person 1: Backend Infrastructure Lead
**Expertise**: Node.js, Deno, Edge Functions, API design
**Responsibilities**:
- All Edge Functions (wallets-list, wallets-add-watch, wallets-remove, etc.)
- Quota management system
- Input validation & security
- Idempotency & concurrency

**Tasks**: 2, 5, 7, 8
**Total Hours**: ~26 hours

---

### Person 2: Database & Security Lead
**Expertise**: PostgreSQL, RLS, migrations, security
**Responsibilities**:
- Database migrations & constraints
- RLS policies & security
- Primary wallet management
- Database optimization

**Tasks**: 3, 6, 15 (partial)
**Total Hours**: ~18 hours

---

### Person 3: Frontend & Integration Lead
**Expertise**: React, TypeScript, UI/UX, state management
**Responsibilities**:
- Auth flow integration
- Wallet shape adapter
- Cross-module integration
- Active selection & state restoration
- React Query integration

**Tasks**: 1, 4, 9, 10, 11
**Total Hours**: ~32 hours

---

### Person 4: Testing & Quality Lead
**Expertise**: Testing frameworks, property-based testing, QA
**Responsibilities**:
- Property-based tests (all 20 properties)
- Integration tests
- E2E tests
- Performance testing
- Documentation

**Tasks**: 12, 13, 14, 17
**Total Hours**: ~34 hours

---

## 🔄 DAILY STANDUP TEMPLATE

**Time**: 9:00 AM (15 minutes)

### Each Person Reports:
1. **Yesterday**: What did you complete?
2. **Today**: What are you working on?
3. **Blockers**: Any issues preventing progress?
4. **Help Needed**: Do you need support?

### Example:
```
Person 1: "Completed Task 2a (wallets-list Edge Function). 
Today: Task 2b (remaining Edge Functions). 
No blockers. Ready to unblock Task 5."

Person 2: "Completed Task 3 (database migrations). 
Today: Task 6 (primary wallet management). 
Waiting for Task 2 to be complete for testing. 
No blockers."

Person 3: "Completed Task 1 (auth integration). 
Today: Task 4 (wallet shape adapter). 
Blocked: Need Task 2 API contracts finalized. 
Can Person 1 share API shapes by EOD?"

Person 4: "Completed test infrastructure setup. 
Today: Task 12a (property tests part 1). 
No blockers. Ready to test as code is completed."
```

---

## 📝 CODE REVIEW CHECKLIST

### Before Creating PR:
- [ ] Code follows project style guide
- [ ] All tests pass locally (`npm test -- --run`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Commit messages are clear
- [ ] PR description explains changes

### PR Template:
```markdown
## Task: [Task Number] - [Task Name]

### Changes
- Brief description of changes

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

### Checklist
- [ ] Code reviewed by self
- [ ] No console.log statements
- [ ] No commented code
- [ ] Documentation updated

### Reviewer Notes
- Any specific areas to focus on?
```

### Reviewer Checklist:
- [ ] Code is correct and follows patterns
- [ ] Tests are comprehensive
- [ ] No security issues
- [ ] Performance is acceptable
- [ ] Documentation is clear

---

## 🚨 BLOCKER RESOLUTION PROCESS

### Step 1: Report Blocker
**Channel**: #blockers
**Format**: 
```
@team BLOCKER: [Task X] - [Brief description]
Impact: [What's blocked]
Needed by: [Time]
```

### Step 2: Team Sync
**Duration**: 15 minutes
**Attendees**: Affected people + lead
**Goal**: Resolve or find workaround

### Step 3: Resolution
**Options**:
1. Unblock the blocking task
2. Find alternative path
3. Reassign work
4. Adjust timeline

### Step 4: Follow-up
**Action**: Update #blockers with resolution
**Notify**: All affected team members

---

## 📊 DAILY METRICS TRACKING

### Track These Metrics:
1. **Tasks Completed**: How many tasks finished?
2. **Code Review Time**: How long for reviews?
3. **Test Pass Rate**: What % of tests pass?
4. **Blockers**: How many active blockers?
5. **Merge Conflicts**: How many conflicts?

### Daily Report (5:00 PM):
```
Day 1 Summary:
- Tasks Completed: 2 (Task 1, Task 3)
- Code Review Time: 1.5 hours
- Test Pass Rate: 95%
- Active Blockers: 0
- Merge Conflicts: 0
- Status: ✅ On track
```

---

## 🔗 DEPENDENCY MANAGEMENT

### Critical Dependencies:

**Task 1 (Auth) → Task 2 (Edge Functions)**
- Person 3 completes Task 1 by EOD Day 1
- Person 1 starts Task 2 on Day 2
- **Risk**: Low (no external dependencies)

**Task 2 (Edge Functions) → Task 5 (Quota)**
- Person 1 completes Task 2 by EOD Day 2
- Person 1 starts Task 5 on Day 3
- **Risk**: Low (same person)

**Task 3 (Database) → Task 6 (Primary Wallet)**
- Person 2 completes Task 3 by EOD Day 1
- Person 2 starts Task 6 on Day 2
- **Risk**: Low (same person)

**Task 4 (Shape Adapter) → Task 10 (Active Selection)**
- Person 3 completes Task 4 by EOD Day 2
- Person 3 starts Task 10 on Day 4
- **Risk**: Low (same person)

**Task 9 (Cross-Module) → Task 11 (React Query)**
- Person 3 completes Task 9 by EOD Day 3
- Person 3 starts Task 11 on Day 5
- **Risk**: Low (same person)

---

## 💬 COMMUNICATION CHANNELS

### Slack Channels:
- **#multi-chain-wallet-dev**: General discussion
- **#blockers**: Report blockers immediately
- **#code-review**: PR reviews & feedback
- **#testing**: Test results & issues
- **#daily-standup**: Standup summaries

### Response Times:
- **Blockers**: 15 minutes
- **Code Review**: 1 hour
- **Questions**: 30 minutes
- **General Chat**: 2 hours

### Escalation:
- **Blocker not resolved in 1 hour** → Escalate to tech lead
- **Merge conflict** → Resolve together
- **Test failure** → Pair debug
- **Performance issue** → Team discussion

---

## 🎯 QUALITY GATES

### Before Merging to Main:
1. ✅ All tests pass
2. ✅ Code review approved
3. ✅ No TypeScript errors
4. ✅ Linting passes
5. ✅ No security issues
6. ✅ Documentation updated

### Before Deploying:
1. ✅ All tests pass on CI/CD
2. ✅ Performance benchmarks met
3. ✅ Security review complete
4. ✅ Documentation complete
5. ✅ Monitoring configured
6. ✅ Rollback plan ready

---

## 📅 WEEKLY SYNC SCHEDULE

### Monday 9:00 AM: Sprint Planning
- Review week's tasks
- Identify dependencies
- Assign work
- Set goals

### Daily 9:00 AM: Standup
- 15-minute sync
- Report progress
- Identify blockers
- Plan day

### Daily 3:00 PM: Integration Check
- Code review status
- Test results
- Any issues?

### Daily 5:00 PM: Wrap-up
- Tomorrow's priorities
- Dependency status
- Blockers for next day

### Friday 4:00 PM: Sprint Review
- What was completed?
- What was blocked?
- Lessons learned
- Next week planning

---

## 🔐 GIT WORKFLOW

### Branch Naming:
```
feat/task-1-auth-integration
feat/task-2-edge-functions
fix/task-1-auth-bug
refactor/task-4-adapter
test/task-12-properties
```

### Commit Messages:
```
feat(task-1): implement AuthProvider session management

- Add session state to AuthProvider
- Implement hydration on user change
- Add route
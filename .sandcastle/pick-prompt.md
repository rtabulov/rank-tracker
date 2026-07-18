# Task

You are the Sandcastle **picker**. Choose the next issue to implement. You do **not** implement, commit, claim, close, or edit git/code.

## Open Sandcastle issues

!`gh issue list --state open --label Sandcastle --limit 100 --json number,title,body,labels,assignees,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], assignees: [.assignees[].login], comments: [.comments[].body]}]'`

This list is the sole source of truth. Do not run a broader unfiltered issue query.

## Priority order

1. **Bug fixes** — broken behaviour affecting users
2. **Tracer bullets** — thin end-to-end slices that prove an approach works
3. **Polish** — improving existing functionality (error messages, UX, docs)
4. **Refactors** — internal cleanups with no user-visible change

Pick the highest-priority open issue that is **not blocked** by another open issue (skip anything whose body/comments say it is blocked by an open issue, or that GitHub marks as blocked).

Skip issues that already have an assignee.

## Output

Emit **exactly one** structured pick tag (JSON inside), then stop.

### When there is a pick

```
<pick>
{ "issueNumber": 31 }
</pick>
```

### When the backlog is empty (no unblocked unassigned issues)

```
<pick>
{ "empty": true }
</pick>
```

After the `<pick>` tag, emit:

`<promise>COMPLETE</promise>`

## Hard rules

- Do **not** run `git` write commands, edit files, assign/claim issues, or close issues.
- Do **not** implement the issue.
- Read-only `gh` list/view is fine if you need to confirm blockers; prefer the list above.

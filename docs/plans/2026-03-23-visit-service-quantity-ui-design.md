# Visit Service Quantity UI — Design

**Date:** 2026-03-23

## Problem

The backend now supports `service_items: [{service_id, quantity}]` on visits, but the frontend form still defaults every service to `quantity: 1` with no way to change it. Tables display service names without quantities.

## Goal

1. Allow users to set quantity per service in the visit form (inline stepper)
2. Show quantity in table/dashboard display when > 1

---

## Visit Form

State changes from `serviceIds: number[]` to `serviceItems: {service_id: number, quantity: number}[]`.

The existing MultiSelect handles selection (add/remove). Below it, each selected service renders as an inline row:

```
[Cleaning — 75.00 zł]    [−]  2  [+]    150.00 zł
[Filling — 120.00 zł]    [−]  1  [+]    120.00 zł
```

- Adding a service via MultiSelect appends `{service_id, quantity: 1}`
- Removing via MultiSelect removes the entry
- `−` decrements quantity (min 1); `+` increments
- Price preview = `sum(item.quantity × service.price)`
- Submit payload: `service_items: serviceItems` (matches API shape)

## Table / Dashboard Display

Format: `name ×N` when N > 1, plain `name` when N = 1. Join with `, `.

Affected: `VisitsPage.tsx`, `DashboardPage.tsx`, `ReportsPage.tsx`.

Example: 3× Cleaning + 1× Filling → `Cleaning ×3, Filling`

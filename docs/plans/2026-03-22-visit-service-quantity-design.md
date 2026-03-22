# Visit Service Quantity — Design

**Date:** 2026-03-22

## Problem

The current `visit_services` association table uses `(visit_id, service_id)` as a composite primary key, so a given service type can only appear once per visit. In practice a patient may receive the same service multiple times in one appointment (e.g. two fillings), and pricing must reflect that.

## Goal

Allow a visit to record multiple instances of the same service, with quantity tracked explicitly and visit price computed accordingly.

## Data Model

Replace the bare `visit_services` SQLAlchemy `Table` with a proper ORM model:

```python
class VisitServiceItem(Base):
    __tablename__ = "visit_service_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    quantity: Mapped[int] = mapped_column(default=1)
```

`Visit` replaces its `services` relationship with:

```python
service_items: Mapped[List["VisitServiceItem"]] = relationship(
    "VisitServiceItem", cascade="all, delete-orphan"
)
```

Price computation: `price = sum(item.quantity * service.price for item in service_items)`

## API Schema

New input type replacing `service_ids`:

```python
class VisitServiceItemInput(BaseModel):
    service_id: int
    quantity: int = 1  # validated >= 1
```

`VisitCreate.service_items: list[VisitServiceItemInput] = []`
`VisitUpdate.service_items: list[VisitServiceItemInput] | None = None`

New read type replacing `services` on `VisitRead`:

```python
class VisitServiceItemRead(BaseModel):
    service_id: int
    quantity: int
    service: ServiceRead
    model_config = {"from_attributes": True}
```

`VisitRead.service_items: list[VisitServiceItemRead]`

## Service Layer

- `create_visit`: fetch `Service` objects by id, build `VisitServiceItem` instances, sum price.
- `update_visit`: when `service_items` is provided, delete existing items and replace with new ones.

## Migration

1. Drop `visit_services` table.
2. Create `visit_service_items` table (`id`, `visit_id`, `service_id`, `quantity`).

## Testing

- Update all existing visit tests using `service_ids` → `service_items`.
- Add price computation tests covering `quantity > 1`.

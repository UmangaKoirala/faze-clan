
begin;

alter table public.draft_catalog
drop constraint if exists draft_catalog_salary_check;

update public.draft_catalog
set active = false;

insert into public.draft_catalog (id, salary)
values
('UCTlVwfAkNh03wSYk5nIXI0Q', 6),
('UCK_G0j7uabTRyY5kOvkNUzQ', 6),
('UCw4Yew1fDA97CrYILHHo3cw', 7),
('UCuQH6Y5Nr2xyTK_YW2Z6LnA', 7),
('UCSy7AER1g0m2t2974VIP4Jw', 7),
('UCbzWk1xMoxIc9sBCpp_GKGA', 7),
('UCliV30F5sOy0W6AhBQpszOg', 8),
('UCrlJD3N3AUpCU8KP2lhTGxw', 7),
('UCbSFLbxWMQWgpAE2mdG__Hw', 7),
('UCld2nAKHz7Dc6TqKX15Q9_A', 7),
('UCFp-yzqxpEvujTnLPCYB1Yw', 9),
('UCAoDLv_CXURrT1P1qjW2YRQ', 8),
('UC6kCB3I2cBFgYc7E8iYxQ7w', 8),
('UCxzwvC9OInWvLcUHYLQWbbA', 8),
('UC2ENBaAY0ZExcD0SRq21QXA', 11),
('UC7wdW2nFJparS7l5HobSwRA', 8),
('UCjqP-Z2hrUXKMfEBCSYfc1Q', 10),
('UCa2pchuMn_hAAEZ7z1GKIJA', 8),
('UCLy5dkhKbJB2ZHsMexoWWFQ', 12),
('UCZ6Hm2xHfQ4am2V2YAFa2Hw', 9),
('UCoVS2BjZV2loujGR8dsGZ3Q', 10),
('UCCu3ZGtPz0NIp7h7fxTK_Og', 10),
('UCPU24QMBABZZePwNJk8q7SA', 12),
('UCAX0KT0AuuOeUIdIrJPhJ6Q', 9),
('UCwcCHw0DlYU4ayl17uAwoEQ', 10),
('UCNWRbk9KsyUavZAmAe0pBXg', 11),
('UCdLVjwG3OkdI3STBgF5ZeaQ', 12),
('UCb9u7mz16KZ_YlGOQq_mZ2w', 10),
('UCmDFk8pxIAqf5ZN9ZkOgOiw', 11),
('UCxw7czBmbsE6SADMndpYEVw', 11)
on conflict (id)
do update set
  salary = excluded.salary,
  active = true;

update public.draft_catalog
set salary = greatest(6, least(25, salary))
where not active;

alter table public.draft_catalog
add constraint draft_catalog_salary_check
check (salary between 6 and 25);

commit;

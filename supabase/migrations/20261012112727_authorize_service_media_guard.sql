-- Invoker trigger expressions may resolve this helper for service writes even
-- behind role exemptions. EXECUTE permits the check; it grants no founder role.
begin;
grant execute on function private.has_role(text[]) to service_role;
commit;

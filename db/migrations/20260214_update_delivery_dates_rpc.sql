-- RPC для полной замены дат (гарантированно устанавливает NULL при отсутствии данных)
-- Решает проблему: PostgREST/клиент может не передавать null при PATCH
CREATE OR REPLACE FUNCTION update_delivery_dates_row(
  p_id BIGINT,
  p_delivery_date TEXT,
  p_assembly_date TEXT,
  p_restrictions TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE delivery_dates
  SET 
    delivery_date = p_delivery_date,
    assembly_date = p_assembly_date,
    restrictions = p_restrictions,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$;

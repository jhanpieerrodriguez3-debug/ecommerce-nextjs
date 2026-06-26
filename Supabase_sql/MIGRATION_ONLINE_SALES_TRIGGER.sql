-- =====================================================================
-- MIGRATION: AUTOMATIZACIÓN DE PEDIDOS ONLINE (STOCK, VENTAS Y CAJA)
-- =====================================================================
-- Ejecuta este script en el SQL Editor de Supabase para automatizar 
-- de manera segura las operaciones comerciales tras insertar un pedido.
-- Al ser una función SECURITY DEFINER, se ejecuta con privilegios de
-- sistema, evitando que los clientes necesiten permisos RLS directos
-- de escritura en las tablas de 'sales', 'products' y 'caja_sessions'.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_order_sales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_caja_history JSONB;
  v_history_entry JSONB;
  v_new_history JSONB;
  v_sale_id TEXT;
BEGIN
  -- 1. Decrementar stock de los productos del pedido en la tabla public.products
  -- NEW.items es un jsonb array. Estructura esperada: [{"id": 12, "quantity": 2, ...}]
  IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      UPDATE public.products
      SET stock = GREATEST(0, stock - (v_item->>'quantity')::int)
      WHERE id = (v_item->>'id')::bigint;
    END LOOP;
  END IF;

  -- 2. Insertar el registro de venta en la tabla public.sales
  v_sale_id := 'VENTA-' || floor(100 + random() * 900)::text;
  INSERT INTO public.sales (id, store_id, amount, type, details, created_at)
  VALUES (
    v_sale_id,
    NEW.store_id,
    NEW.total,
    'online',
    'Pedido Online ' || NEW.id || ' - Cliente: ' || NEW.customer_name,
    NEW.created_at
  );

  -- 3. Buscar si hay una caja abierta para esta tienda y actualizar balance e historial
  IF EXISTS (
    SELECT 1 FROM public.caja_sessions
    WHERE store_id = NEW.store_id AND is_open = true
  ) THEN
    -- Obtener historial de la caja abierta
    SELECT history INTO v_caja_history
    FROM public.caja_sessions
    WHERE store_id = NEW.store_id AND is_open = true
    ORDER BY opened_at DESC
    LIMIT 1;

    -- Construir nueva entrada de historial
    v_history_entry := json_build_object(
      'time', to_char(now() AT TIME ZONE 'America/Santiago', 'HH24:MI:SS'),
      'type', 'Ingreso Ventas',
      'amount', NEW.total,
      'description', 'Venta Online Pedido ' || NEW.id
    )::jsonb;

    IF v_caja_history IS NULL OR jsonb_typeof(v_caja_history) <> 'array' THEN
      v_new_history := jsonb_build_array(v_history_entry);
    ELSE
      v_new_history := jsonb_build_array(v_history_entry) || v_caja_history;
    END IF;

    -- Actualizar el saldo e historial de la caja registradora activa
    UPDATE public.caja_sessions
    SET current_amount = current_amount + NEW.total,
        history = v_new_history
    WHERE store_id = NEW.store_id AND is_open = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Vincular la función handle_new_order_sales como trigger AFTER INSERT en public.orders
DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_order_sales();

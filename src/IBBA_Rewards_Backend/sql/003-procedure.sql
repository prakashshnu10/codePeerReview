CREATE OR REPLACE PROCEDURE public.put_user_nft_by_trx_id(
        IN data jsonb,
        IN _trx_id character varying)
LANGUAGE 'plpgsql'
AS $BODY$

declare 
    var varchar;
    key varchar;
    value varchar;
begin
    FOR key, value IN SELECT * FROM jsonb_each_text(data) loop
            select constant into var from M_CONSTANTS where id = key::int;
        RAISE NOTICE 'Key: %, Value: %', key::int, value;
        case var
                when 'processed' then update public.t_user_nft set processed = cast(value as BOOLEAN), updated_at = current_timestamp where trx_id::text = _trx_id;
                when 'direct_sale' then update public.t_user_nft set direct_sale = cast(value as BOOLEAN), updated_at = current_timestamp where trx_id::text = _trx_id;
                end case;
    END LOOP;
END;
$BODY$;


---------------------------------------------------------------------------


CREATE OR REPLACE PROCEDURE public.post_user_nft_reward(
        IN _user_id uuid,
        IN _from_user_id uuid,
        IN _nft_id uuid,
        IN _reward_id uuid,
        IN _reward_level_id uuid,
        IN _reward_amount numeric,
        IN _eligible_for_direct_sales boolean,
        IN _is_nft_purchased boolean,
        IN _created_by character varying)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.t_user_nft_reward(user_id, from_user_id, nft_id, reward_id, reward_level_id, reward_amount, eligible_for_direct_sales, is_nft_purchased, created_at, updated_at, created_by)
        VALUES(_user_id, _from_user_id, _nft_id, _reward_id, _reward_level_id, _reward_amount, _eligible_for_direct_sales, _is_nft_purchased,  current_timestamp, current_timestamp, _created_by);
$BODY$;
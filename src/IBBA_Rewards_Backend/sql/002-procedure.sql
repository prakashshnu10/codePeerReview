-- PROCEDURE: public.put_admin_treasury_by_user_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_admin_treasury_by_user_id(jsonb, character varying);

CREATE OR REPLACE PROCEDURE public.put_admin_treasury_by_user_id(
	IN data jsonb,
	IN _id character varying)
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
		when 'current_treasury_wallet' then update public.a_users set current_treasury_wallet = value, updated_at = current_timestamp where user_id::text = _id;
		when 'previous_treasury_wallet' then update public.a_users set previous_treasury_wallet = value, updated_at = current_timestamp where user_id::text = _id;
		end case;
    END LOOP;
END;
$BODY$;



--------05-10-2023

-- PROCEDURE: public.put_user_nft_reward_by_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_user_nft_reward_by_id(jsonb, character varying);

CREATE OR REPLACE PROCEDURE public.put_user_nft_reward_by_id(
	IN data jsonb,
	IN _id character varying)
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
		when 'reward_distributed' then update public.t_user_nft_reward set reward_distributed = cast(value as BOOLEAN), updated_at = current_timestamp where id::text = _id;
		when 'message' then update public.t_user_nft_reward set message = value, updated_at = current_timestamp where id::text = _id;
		when 'trx_hash' then update public.t_user_nft_reward set trx_hash = value, updated_at = current_timestamp where id::text = _id;
		
		end case;
    END LOOP;
END;
$BODY$;


---------------------------

-- PROCEDURE: public.put_user_nft_reward_by_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_user_nft_reward_by_id(jsonb, character varying);

CREATE OR REPLACE PROCEDURE public.put_user_nft_reward_by_id(
	IN data jsonb,
	IN _id character varying)
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
		when 'reward_distributed' then update public.t_user_nft_reward set reward_distributed = cast(value as BOOLEAN), updated_at = current_timestamp where id::text = _id;
		when 'message' then update public.t_user_nft_reward set message = value, updated_at = current_timestamp where id::text = _id;
		when 'trx_hash' then update public.t_user_nft_reward set trx_hash = value, updated_at = current_timestamp where id::text = _id;
		when 'gas_fee' then update public.t_user_nft_reward set gas_fee = cast(value as numeric), updated_at = current_timestamp where id::text = _id;
		
		end case;
    END LOOP;
END;
$BODY$;

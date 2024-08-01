

-------------------------
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
		when 'notification' then update public.t_user_nft_reward set notification = cast(value as BOOLEAN), updated_at = current_timestamp where id::text = _id;
		
		end case;
    END LOOP;
END;
$BODY$;

------------------------------



CREATE OR REPLACE PROCEDURE public.put_user_badge_status_by_id(
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
		when 'bonus_distributed' then update public.t_user_badges set bonus_distributed = cast(value as BOOLEAN), updated_at = current_timestamp where id::text = _id;
		when 'notification' then update public.t_user_badges set notification = cast(value as BOOLEAN), updated_at = current_timestamp where id::text = _id;
		when 'trx_hash' then update public.t_user_badges set trx_hash = value, updated_at = current_timestamp where id::text = _id;
		end case;
    END LOOP;
END;
$BODY$;


---------------------------------

CREATE OR REPLACE PROCEDURE public.post_user_notification(
	IN _user_id uuid,
	IN _t_user_nft_reward_id uuid,
	IN _t_user_badges_id uuid,
	IN _t_user_nft_id uuid,
	IN _type character varying,
	IN _reward_status character varying,
	IN _bonus_status character varying,
	IN _read_status character varying,
	IN _created_by character varying)
LANGUAGE 'sql'
AS $BODY$
    INSERT INTO public.t_user_notifications(user_id, t_user_nft_reward_id, t_user_badges_id, t_user_nft_id, type, reward_status, bonus_status, read_status, created_at, updated_at, created_by)
        VALUES(_user_id, _t_user_nft_reward_id,_t_user_badges_id, _t_user_nft_id, _type, _reward_status, _bonus_status, _read_status, current_timestamp, current_timestamp, _created_by);
$BODY$;


------------------------------------


-- PROCEDURE: public.post_nft(integer, character varying, character varying, character varying, character varying, character varying)

-- DROP PROCEDURE IF EXISTS public.post_nft(integer, character varying, character varying, character varying, character varying, character varying);

CREATE OR REPLACE PROCEDURE public.post_nft(
	IN _token_id integer,
	IN _contract_address character varying,
	IN _title character varying,
	IN _description character varying,
	IN _image character varying,
	IN _created_by character varying)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.m_nft(token_id, contract_address,title, description, image, created_at, updated_at, created_by)
	VALUES(_token_id, _contract_address,_title,_description,_image, current_timestamp, current_timestamp, _created_by);
$BODY$;




----------------------


-- PROCEDURE: public.post_register_user(character varying, character varying, character varying, character varying, boolean, character varying, character varying, character varying, uuid, character varying, bigint)

-- DROP PROCEDURE IF EXISTS public.post_register_user(character varying, character varying, character varying, character varying, boolean, character varying, character varying, character varying, uuid, character varying, bigint);

CREATE OR REPLACE PROCEDURE public.post_register_user(
	IN _email character varying,
	IN _first_name character varying,
	IN _last_name character varying,
	IN _password character varying,
	IN _is_verified boolean,
	IN _otp character varying,
	IN _user_wallet character varying,
	IN _referral_code character varying,
	IN _referred_by_user_id uuid,
	IN _created_by character varying,
	IN _level bigint)
LANGUAGE 'plpgsql'
AS $BODY$

begin
INSERT INTO public.m_users(user_id, email, first_name, last_name, "password", is_verified, otp, user_wallet, referral_code, referred_by_user_id, created_at, updated_at, created_by, "level")
VALUES(uuid_generate_v4(), _email, _first_name, _last_name, _password, _is_verified, _otp, _user_wallet, _referral_code, _referred_by_user_id, current_timestamp, current_timestamp, _created_by, _level);
end
$BODY$;


-----------------------


-- PROCEDURE: public.post_user_badges(uuid, uuid, numeric, character varying)

-- DROP PROCEDURE IF EXISTS public.post_user_badges(uuid, uuid, numeric, character varying);

CREATE OR REPLACE PROCEDURE public.post_user_badges(
	IN _user_id uuid,
	IN _badge_id uuid,
	IN _bonus_amount numeric,
	IN _created_by character varying)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.t_user_badges(user_id, badge_id, bonus_amount, created_at, updated_at, created_by)
	VALUES(_user_id, _badge_id, _bonus_amount, current_timestamp, current_timestamp, _created_by);
$BODY$;



--------------------------------


-- PROCEDURE: public.post_user_nft(uuid, uuid, character varying, character varying, character varying, numeric)

-- DROP PROCEDURE IF EXISTS public.post_user_nft(uuid, uuid, character varying, character varying, character varying, numeric);

CREATE OR REPLACE PROCEDURE public.post_user_nft(
	IN _user_id uuid,
	IN _nft_id uuid,
	IN _market_type character varying,
	IN _created_by character varying,
	IN _updated_by character varying,
	IN _nft_price numeric)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.t_user_nft(user_id, nft_id, market_type, created_at, updated_at, created_by, updated_by, nft_price)
	VALUES(_user_id, _nft_id, _market_type, current_timestamp, current_timestamp, _created_by, _updated_by, _nft_price);
$BODY$;



-------------------------------------




-- PROCEDURE: public.post_user_nft_reward(uuid, uuid, uuid, uuid, uuid, numeric, character varying)

-- DROP PROCEDURE IF EXISTS public.post_user_nft_reward(uuid, uuid, uuid, uuid, uuid, numeric, character varying);

CREATE OR REPLACE PROCEDURE public.post_user_nft_reward(
	IN _user_id uuid,
	IN _from_user_id uuid,
	IN _nft_id uuid,
	IN _reward_id uuid,
	IN _reward_level_id uuid,
	IN _reward_amount numeric,
	IN _created_by character varying)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.t_user_nft_reward(user_id, from_user_id, nft_id, reward_id, reward_level_id, reward_amount, created_at, updated_at, created_by)
	VALUES(_user_id, _from_user_id, _nft_id, _reward_id, _reward_level_id, _reward_amount,  current_timestamp, current_timestamp, _created_by);
$BODY$;




--------------------------------

-- PROCEDURE: public.put_reward_level_by_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_reward_level_by_id(jsonb, character varying);

CREATE OR REPLACE PROCEDURE public.put_reward_level_by_id(
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
		when 'reward_perc' then update public.m_reward_level set reward_perc = cast(value as numeric), updated_at = current_timestamp where id::text = _id;
		end case;
    END LOOP;
END;
$BODY$;


---------------------------------------



-- PROCEDURE: public.put_user_badge_status_by_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_user_badge_status_by_id(jsonb, character varying);

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
		when 'trx_hash' then update public.t_user_badges set trx_hash = value, updated_at = current_timestamp where id::text = _id;
		end case;
    END LOOP;
END;
$BODY$;


-------------------------------------------------------------


-- PROCEDURE: public.put_user_by_user_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_user_by_user_id(jsonb, character varying);

CREATE OR REPLACE PROCEDURE public.put_user_by_user_id(
	IN data jsonb,
	IN _user_id character varying)
LANGUAGE 'plpgsql'
AS $BODY$

declare 
    var varchar;
    key varchar;
    value varchar;
    user_exists boolean;
begin
	SELECT EXISTS(SELECT 1 FROM public.t_user_nft WHERE user_id::text = _user_id) INTO user_exists;
    FOR key, value IN SELECT * FROM jsonb_each_text(data) loop
	    select constant into var from M_CONSTANTS where id = key::int;
        RAISE NOTICE 'Key: %, Value: %', key::int, value;
        case var
		when 'is_verified' then update public.m_users set is_verified = cast(value as BOOLEAN), updated_at = current_timestamp where user_id::text = _user_id;
		when 'otp' then update public.m_users set otp = value, updated_at = current_timestamp where user_id::text = _user_id;
	    when 'first_name' then update public.m_users set first_name = value, updated_at = current_timestamp where user_id::text = _user_id;
	    when 'last_name' then update public.m_users set last_name = value, updated_at = current_timestamp where user_id::text = _user_id;
		when 'password' then update public.m_users set password = value, updated_at = current_timestamp where user_id::text = _user_id;
	    when 'user_wallet' then 
	    	IF NOT user_exists THEN
	   			update public.m_users set user_wallet = value, updated_at = current_timestamp where user_id::text = _user_id;
	   		end if;
		end case;
    END LOOP;
END;
$BODY$;





-------------------------------------

-- PROCEDURE: public.put_user_nft_by_trx_id(jsonb, character varying)

-- DROP PROCEDURE IF EXISTS public.put_user_nft_by_trx_id(jsonb, character varying);

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
		end case;
    END LOOP;
END;
$BODY$;


-------------------------------------

-- PROCEDURE: public.put_user_nft_reward_status_by_user_id(character varying, boolean)

-- DROP PROCEDURE IF EXISTS public.put_user_nft_reward_status_by_user_id(character varying, boolean);

CREATE OR REPLACE PROCEDURE public.put_user_nft_reward_status_by_user_id(
	IN _user_id character varying,
	IN _reward_distributed boolean)
LANGUAGE 'plpgsql'
AS $BODY$
begin
	update public.t_user_nft_reward 
	set reward_distributed = _reward_distributed
	where id::uuid = id;
end
$BODY$;

-- FUNCTION: public.get_admin_treasury()

-- DROP FUNCTION IF EXISTS public.get_admin_treasury();

CREATE OR REPLACE FUNCTION public.get_admin_treasury(
	)
    RETURNS SETOF a_users 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

	SELECT* FROM a_users;
$BODY$;




---------------------------------------------10-10-2023


CREATE OR REPLACE FUNCTION public.get_user_name_using_reward_trx_hash(
	_trx_hash character varying)
    RETURNS TABLE( first_name character varying, last_name_name character varying) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
return QUERY 		
SELECT mu.first_name, mu.last_name
FROM t_user_nft_reward AS tunr
JOIN m_users AS mu ON tunr.user_id = mu.user_id
WHERE tunr.trx_hash = _trx_hash;
end;
$BODY$;


----------------------------------------------12-10-2023


CREATE OR REPLACE FUNCTION public.get_all_users(
	)
    RETURNS SETOF m_users 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

	select * from public.m_users;
$BODY$;

-------------------------------------------


CREATE OR REPLACE FUNCTION public.get_user_nft_reward(
        _id integer,
        _value character varying)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

declare var varchar;
begin
        select constant into var from M_CONSTANTS where id = _id;
        case var
        when 'user_id' then return query select * from public.t_user_nft_reward where user_id::text = _value;
        when 'trx_hash' then return query select * from public.t_user_nft_reward where trx_hash = _value;
        end case;
end;
$BODY$;

-----------------------------------------------

CREATE OR REPLACE FUNCTION public.get_all_user_nft_reward(
	)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

	select * from public.t_user_nft_reward;
$BODY$;

-------------------------------------------13-10-2023

CREATE OR REPLACE FUNCTION public.get_undistributed_bonus(
	)
    RETURNS SETOF t_user_badges
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
    SELECT * FROM t_user_badges
    WHERE bonus_distributed = false;
$BODY$;



-------------------------------------------

-- FUNCTION: public.get_admin(integer, character varying)

-- DROP FUNCTION IF EXISTS public.get_admin(integer, character varying);

CREATE OR REPLACE FUNCTION public.get_admin(
	_id integer,
	_value character varying)
    RETURNS SETOF a_users 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

declare var varchar;
begin
	select constant into var from M_CONSTANTS where id = _id;
	case var
	when 'user_id' then return query select * from public.a_users where user_id::text = _value;
	end case;
end;
$BODY$;




----------------------------------------------------------------



CREATE OR REPLACE FUNCTION public.get_undistributed_rewards(
	)
    RETURNS SETOF t_user_nft_reward
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
    SELECT *
    FROM public.t_user_nft_reward
    WHERE reward_distributed = false;
$BODY$;

-----------------------------------------------------------
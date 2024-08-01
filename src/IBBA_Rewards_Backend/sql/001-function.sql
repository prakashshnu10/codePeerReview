-- FUNCTION: public.get_authenticate_user(character varying, character varying)

-- DROP FUNCTION IF EXISTS public.get_authenticate_user(character varying, character varying);

CREATE OR REPLACE FUNCTION public.get_authenticate_user(
	_email character varying,
	_password character varying)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

BEGIN
  IF exists (select true from m_users where email = _email and password = _password ) then 
  return true;
  else
  return false;
  end if;
end;
$BODY$;



-----------------------------------------------------------------------------------


-- FUNCTION: public.get_badges()

-- DROP FUNCTION IF EXISTS public.get_badges();

CREATE OR REPLACE FUNCTION public.get_badges(
	)
    RETURNS SETOF m_badges 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

	select * from public.m_badges;
$BODY$;




--------------------------------------------------




-- FUNCTION: public.get_constant(character varying)

-- DROP FUNCTION IF EXISTS public.get_constant(character varying);

CREATE OR REPLACE FUNCTION public.get_constant(
	_value character varying)
    RETURNS SETOF m_constants 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
return QUERY 
select * from public.m_constants where constant  = _value;
end
$BODY$;





------------------------------------------------------------------------


-- FUNCTION: public.get_from_user_nft_reward(uuid, uuid)

-- DROP FUNCTION IF EXISTS public.get_from_user_nft_reward(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_from_user_nft_reward(
	_from_user_id uuid,
	_user_id uuid)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
	return query select * from public.t_user_nft_reward where from_user_id = _from_user_id and user_id = _user_id;
end;
$BODY$;




---------------------------------------------------------------------------------


-- FUNCTION: public.get_hightier_users(uuid)

-- DROP FUNCTION IF EXISTS public.get_hightier_users(uuid);

CREATE OR REPLACE FUNCTION public.get_hightier_users(
	_user_id uuid)
    RETURNS TABLE(user_id uuid, referred_by_user_id uuid, level bigint, reward_level_id uuid, reward_id uuid, reward_perc numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
return QUERY 		
WITH RECURSIVE user_hierarchy AS (
      SELECT t.user_id, t.referred_by_user_id, t.level
      FROM m_users t
      WHERE t.user_id = _user_id
      UNION ALL
      SELECT u.user_id, u.referred_by_user_id, u.level
      FROM user_hierarchy uh
      INNER JOIN m_users u ON uh.referred_by_user_id = u.user_id
    )
SELECT t1.*, t2.id, t2.reward_id, t2.reward_perc
    FROM user_hierarchy t1
    LEFT JOIN m_reward_level t2 ON t1.level = t2."level";
end;
$BODY$;




----------------------------------------------------------------------------


-- FUNCTION: public.get_lowtier_users(uuid)

-- DROP FUNCTION IF EXISTS public.get_lowtier_users(uuid);

CREATE OR REPLACE FUNCTION public.get_lowtier_users(
	_user_id uuid)
    RETURNS TABLE(user_id uuid, referred_by_user_id uuid, level bigint) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
return QUERY 		
WITH RECURSIVE user_hierarchy AS (
        SELECT t.user_id, t.referred_by_user_id, t.level
        FROM m_users t
        WHERE t.user_id = _user_id
        UNION ALL
        SELECT u.user_id, u.referred_by_user_id, u.level
        FROM user_hierarchy uh
        INNER JOIN m_users u ON uh.user_id = u.referred_by_user_id
     )
     SELECT * FROM user_hierarchy;
end;
$BODY$;






------------------------------------------------------

-- FUNCTION: public.get_nft(integer, character varying)

-- DROP FUNCTION IF EXISTS public.get_nft(integer, character varying);

CREATE OR REPLACE FUNCTION public.get_nft(
	_id integer,
	_value character varying)
    RETURNS SETOF m_nft 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

declare var varchar;
begin
select constant into var from M_CONSTANTS where id = _id;
case var
when 'nft_id' then return query select * from public.m_nft where id::text = _value;
when 'token_id' then return query select * from public.m_nft where token_id  = _value::int;
when 'title' then return query select * from public.m_nft where title = _value;
end case;
end;
$BODY$;






---------------------------------

-- FUNCTION: public.get_nft_purchased_by_low_tier(uuid)

-- DROP FUNCTION IF EXISTS public.get_nft_purchased_by_low_tier(uuid);

CREATE OR REPLACE FUNCTION public.get_nft_purchased_by_low_tier(
	_user_id uuid)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

begin
return(  		
WITH RECURSIVE user_hierarchy AS (
        SELECT t.user_id, t.referred_by_user_id, t.level
        FROM m_users t
        WHERE user_id = _user_id
        UNION ALL
        SELECT u.user_id, u.referred_by_user_id, u.level
        FROM user_hierarchy uh
        INNER JOIN m_users u ON uh.user_id = u.referred_by_user_id
     )
 SELECT  count(*) FROM user_hierarchy t1 left join t_user_nft t2
    on t1.user_id = t2.user_id where t1.referred_by_user_id = _user_id
    and t2.trx_id is not null);
end;
$BODY$;



-------------------------


-- FUNCTION: public.get_reward_level(integer, character varying)

-- DROP FUNCTION IF EXISTS public.get_reward_level(integer, character varying);

CREATE OR REPLACE FUNCTION public.get_reward_level(
	_id integer,
	_value character varying)
    RETURNS SETOF m_reward_level 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

declare var varchar;
begin
	select constant into var from M_CONSTANTS where id = _id;
	case var
	when 'reward_level_id' then return query select * from public.m_reward_level where id::text = _value;
	end case;
end;
$BODY$;





------------------------------


-- FUNCTION: public.get_undistributed_bonus()

-- DROP FUNCTION IF EXISTS public.get_undistributed_bonus();

CREATE OR REPLACE FUNCTION public.get_undistributed_bonus(
	)
    RETURNS SETOF t_user_badges 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

    SELECT * FROM t_user_badges 
    WHERE created_at >= now() - interval '24 hours' AND bonus_distributed = false;
$BODY$;





-------------------------


-- FUNCTION: public.get_undistributed_rewards()

-- DROP FUNCTION IF EXISTS public.get_undistributed_rewards();

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
    WHERE created_at >= now() - interval '24 hours' AND reward_distributed = false;
$BODY$;



-------------------------------------------------------------



-- FUNCTION: public.get_unprocessed()

-- DROP FUNCTION IF EXISTS public.get_unprocessed();

CREATE OR REPLACE FUNCTION public.get_unprocessed(
	)
    RETURNS TABLE(user_id uuid, nft_id uuid, trx_id uuid, price numeric, created_at timestamp without time zone) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
begin
return QUERY 		
SELECT t1.user_id, t1.nft_id, t1.trx_id, t2.price, t1.created_at
    FROM t_user_nft t1
    LEFT JOIN m_nft t2 ON t1.nft_id = t2.id
    WHERE t1.processed IS FALSE;
end;
$BODY$;

-----------------------------------------


-- FUNCTION: public.get_user(integer, character varying)

-- DROP FUNCTION IF EXISTS public.get_user(integer, character varying);

CREATE OR REPLACE FUNCTION public.get_user(
	_id integer,
	_value character varying)
    RETURNS SETOF m_users 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

declare var varchar;
begin
	select constant into var from M_CONSTANTS where id = _id;
	case var
	when 'email' then return query select * from public.m_users where email = _value;
	when 'referral_code' then return query select * from public.m_users where referral_code = _value;
	when 'user_id' then return query select * from public.m_users where user_id::text = _value;
	when 'referred_by_user_id' then return query select * from public.m_users where referred_by_user_id::text = _value;
	when 'user_wallet' then return query select * from public.m_users where user_wallet = _value;
	when 'admin' then return query select * from m_users mu where user_id in (select user_id from a_users where user_id::text = _value);
	end case;
end;
$BODY$;


--------------------------------------


-- FUNCTION: public.get_user_badges_and_criteria(uuid)

-- DROP FUNCTION IF EXISTS public.get_user_badges_and_criteria(uuid);

CREATE OR REPLACE FUNCTION public.get_user_badges_and_criteria(
	_user_id uuid)
    RETURNS TABLE(user_badge_id uuid, user_id uuid, badge_id uuid, user_bonus numeric, trx_hash character varying, badge character varying, min_nft_criteria bigint, badge_bonus numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
return QUERY 		
SELECT
      t.id AS user_badge_id,
      t.user_id,
      t.badge_id,
      t.bonus_amount AS user_bonus,
      t.trx_hash,
      m.badge,
      m.min_nft_criteria,
      m.bonus_amount AS badge_bonus
  FROM
      t_user_badges AS t
  LEFT JOIN
      m_badges AS m
  ON
      t.badge_id = m.id
  WHERE
      t.user_id = _user_id;
end;
$BODY$;





----------------------------------------------------

-- FUNCTION: public.get_user_nft(integer, character varying)

-- DROP FUNCTION IF EXISTS public.get_user_nft(integer, character varying);

CREATE OR REPLACE FUNCTION public.get_user_nft(
	_id integer,
	_value character varying)
    RETURNS SETOF t_user_nft 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

declare var varchar;
begin
	select constant into var from M_CONSTANTS where id = _id;
	case var
	when 'user_id' then return query select * from public.t_user_nft where user_id::text = _value;
	end case;
end;
$BODY$;



----------------------------------------





-- FUNCTION: public.get_user_nft_reward(integer, character varying)

-- DROP FUNCTION IF EXISTS public.get_user_nft_reward(integer, character varying);

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
	end case;
end;
$BODY$;


---------------------------------------------------

-- FUNCTION: public.get_all_reward_level()

-- DROP FUNCTION IF EXISTS public.get_all_reward_level();

CREATE OR REPLACE FUNCTION public.get_all_reward_level(
	)
    RETURNS SETOF m_reward_level 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$


	select * from public.m_reward_level;
$BODY$;




--------------------------------------------------------------

-- FUNCTION: public.update_reward_status(uuid, boolean)

-- DROP FUNCTION IF EXISTS public.update_reward_status(uuid, boolean);

CREATE OR REPLACE FUNCTION public.update_reward_status(
	_reward_id_distributed uuid,
	status boolean)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
    UPDATE t_user_nft_reward
    SET reward_distributed = status
    WHERE id = _reward_Id_Distributed;
    
    -- You can also add additional logic or error handling here if needed.
    
END;
$BODY$;


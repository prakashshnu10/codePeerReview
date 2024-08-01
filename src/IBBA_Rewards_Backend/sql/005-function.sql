
DROP FUNCTION IF EXISTS public.get_user_badges_and_criteria(uuid);


----------------

CREATE OR REPLACE FUNCTION public.get_user_badges_and_criteria(
	_user_id uuid)
    RETURNS TABLE(user_badge_id uuid, user_id uuid, badge_id uuid, user_bonus numeric, trx_hash character varying, badge character varying, min_nft_criteria bigint, badge_image character varying, badge_bonus numeric)
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
      t.user_bonus_amount AS user_bonus,
      t.trx_hash,
      m.badge,
      m.min_nft_criteria,
	  m.image,
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

---------------------------


CREATE OR REPLACE FUNCTION public.get_all_direct_reward_due_notification(
	)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
        SELECT * FROM t_user_nft_reward 
        WHERE reward_distributed = false AND eligible_for_direct_sales = true and notification = false
$BODY$;


------------------------------------

CREATE OR REPLACE FUNCTION public.get_all_direct_reward_received_notification(
	)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
        SELECT * FROM t_user_nft_reward 
        WHERE reward_distributed = true AND eligible_for_direct_sales = true and notification = false
$BODY$;



-----------

CREATE OR REPLACE FUNCTION public.get_all_indirect_reward_due_notification(
	)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
       SELECT * FROM t_user_nft_reward 
       WHERE reward_distributed = false AND eligible_for_direct_sales = false and notification = false
$BODY$;

----------

CREATE OR REPLACE FUNCTION public.get_all_indirect_reward_received_notification(
	)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
      SELECT * FROM t_user_nft_reward 
      WHERE reward_distributed = true AND eligible_for_direct_sales = false and notification = false
$BODY$;



-------------------------

CREATE OR REPLACE FUNCTION public.get_all_nft_purchased_notification(
	)
    RETURNS SETOF t_user_nft 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
      SELECT * FROM t_user_nft WHERE notification = false
$BODY$;



-------------------------


CREATE OR REPLACE FUNCTION public.get_all_bonus_due_notification(
	)
    RETURNS SETOF t_user_badges 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
      SELECT * FROM t_user_badges 
        WHERE bonus_distributed = false AND notification = false
$BODY$;


-----------------------------


CREATE OR REPLACE FUNCTION public.get_all_bonus_received_notification(
	)
    RETURNS SETOF t_user_badges 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
        SELECT * FROM t_user_badges 
        WHERE bonus_distributed = true AND notification = false
$BODY$;

------------------

CREATE OR REPLACE FUNCTION public.get_all_badges_upgrade_notification(
        )
    RETURNS SETOF t_user_badges 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
      SELECT * FROM t_user_badges 
        WHERE bonus_distributed = true
$BODY$;


-----------------------

CREATE OR REPLACE FUNCTION public.get_badge_by_id(
	_id integer,
	_value character varying)
    RETURNS SETOF m_badges 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

declare var varchar;
begin
select constant into var from M_CONSTANTS where id = _id;
case var
when 'badge_id' then return query select * from public.m_badges where id::text = _value;
end case;
end;
$BODY$;

------------------

CREATE OR REPLACE FUNCTION public.get_hightier_users_for_indirect_sales_reward(
	_user_id uuid)
    RETURNS TABLE(user_id uuid, referred_by_user_id uuid, level bigint, new_level bigint, level_reward bigint, reward_level_id uuid, reward_id uuid, reward_perc numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    max_new_level bigint;
	current_level_reward bigint := 7;
BEGIN
    -- Calculate the maximum new level
    SELECT MAX(ph.new_level) INTO max_new_level
    FROM (
        WITH RECURSIVE user_hierarchy AS (
            SELECT t.user_id, t.referred_by_user_id, t.level
            FROM m_users t
            WHERE t.user_id = _user_id
            UNION ALL
            SELECT u.user_id, u.referred_by_user_id, u.level
            FROM user_hierarchy uh
            INNER JOIN m_users u ON uh.referred_by_user_id = u.user_id
        )
        SELECT ROW_NUMBER() OVER (ORDER BY t1.level ASC) as new_level
        FROM (
            SELECT *
            FROM user_hierarchy
            ORDER BY level DESC
            OFFSET 1 LIMIT 6 -- Retrieve the last 5 levels
        ) t1
    ) ph;
    -- Return results
    RETURN QUERY 		
    WITH RECURSIVE user_hierarchy AS (
        SELECT t.user_id, t.referred_by_user_id, t.level
        FROM m_users t
        WHERE t.user_id = _user_id
        UNION ALL
        SELECT u.user_id, u.referred_by_user_id, u.level
        FROM user_hierarchy uh
        INNER JOIN m_users u ON uh.referred_by_user_id = u.user_id
    )
    SELECT t2.*, t3.id, t3.reward_id, t3.reward_perc
    FROM (
        SELECT t1.*, ROW_NUMBER() OVER (ORDER BY t1.level ASC) as new_level,
		current_level_reward - ROW_NUMBER() OVER (ORDER BY t1.level DESC) as level_reward
        FROM (
            SELECT *
            FROM user_hierarchy
            ORDER BY level DESC
            OFFSET 1 LIMIT 6 -- Retrieve the last 5 levels
        ) t1
    ) t2
    LEFT JOIN m_reward_level t3 ON  t2.level_reward = t3."level"
    WHERE t2.new_level < max_new_level;
END;
$BODY$;




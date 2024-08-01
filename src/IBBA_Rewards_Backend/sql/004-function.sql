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

-------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_from_user_nft_indirect_reward(
        _from_user_id uuid,
        _user_id uuid)
    RETURNS SETOF t_user_nft_reward 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

begin
        return query select * from public.t_user_nft_reward where from_user_id = _from_user_id and user_id = _user_id and eligible_for_direct_sales = false;
end;
$BODY$;


------------------------------------------

        
CREATE OR REPLACE FUNCTION public.get_user_badges_and_criteria(_user_id uuid)
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
      t.user_bonus_amount AS user_bonus,
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
        
----------------------------------------------------------        

CREATE OR REPLACE FUNCTION public.get_hightier_users_upto_five(
	_user_id uuid)
    RETURNS TABLE(user_id uuid, referred_by_user_id uuid, level bigint, new_level bigint, reward_level_id uuid, reward_id uuid, reward_perc numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    max_new_level bigint;
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
            LIMIT 6 -- Retrieve the last 5 levels
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
        SELECT t1.*, ROW_NUMBER() OVER (ORDER BY t1.level ASC) as new_level
        FROM (
            SELECT *
            FROM user_hierarchy
            ORDER BY level DESC
            LIMIT 6 -- Retrieve the last 5 levels
        ) t1
    ) t2
    LEFT JOIN m_reward_level t3 ON t2.new_level = t3."level"
    WHERE t2.new_level < max_new_level;
END;
$BODY$;
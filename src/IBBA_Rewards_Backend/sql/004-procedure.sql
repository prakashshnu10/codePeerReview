
 DROP PROCEDURE IF EXISTS public.post_user_badges(uuid, uuid, numeric, character varying);

 ------------------------------------------------------------------------------------------

 CREATE OR REPLACE PROCEDURE public.post_user_badges(
        IN _user_id uuid,
        IN _badge_id uuid,
        IN _user_bonus_amount numeric,
        IN _created_by character varying)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.t_user_badges(user_id, badge_id, user_bonus_amount, created_at, updated_at, created_by)
        VALUES(_user_id, _badge_id, _user_bonus_amount, current_timestamp, current_timestamp, _created_by);
        
$BODY$;


------------------------------------

CREATE OR REPLACE PROCEDURE public.post_user_nft_reward(
        IN _user_id uuid,
        IN _from_user_id uuid,
        IN _nft_id uuid,
        IN _reward_id uuid,
        IN _reward_level_id uuid,
        IN _reward_amount numeric,
        IN _eligible_for_direct_sales boolean,
        IN _created_by character varying)
LANGUAGE 'sql'
AS $BODY$

    INSERT INTO public.t_user_nft_reward(user_id, from_user_id, nft_id, reward_id, reward_level_id, reward_amount, eligible_for_direct_sales, created_at, updated_at, created_by)
        VALUES(_user_id, _from_user_id, _nft_id, _reward_id, _reward_level_id, _reward_amount, _eligible_for_direct_sales,  current_timestamp, current_timestamp, _created_by);
$BODY$;
ALTER TABLE public.m_users
ADD COLUMN eligible_for_direct_sales boolean DEFAULT false;

--------------------------

ALTER TABLE public.m_users
ADD COLUMN is_eligible_for_indirect_reward boolean DEFAULT false;


-----------------------------------------

ALTER TABLE public.m_users
ADD COLUMN is_nft_purchased boolean DEFAULT false;

--------------------------------


ALTER TABLE public.m_users
ADD COLUMN reward_due numeric null;


---------------------------

ALTER TABLE t_user_badges
ADD message character varying(500) COLLATE pg_catalog."default";



---------------------------

ALTER TABLE m_users
RENAME COLUMN eligible_for_direct_sales TO is_eligible_for_direct_sales;


------------------

ALTER TABLE t_user_badges
RENAME COLUMN bonus_amount TO user_bonus_amount;

---------------------------------------


ALTER TABLE public.t_user_nft_reward
DROP COLUMN is_nft_purchased

----------------------------------

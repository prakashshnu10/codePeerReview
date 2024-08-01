select  count(*) from
(SELECT DISTINCT * FROM (VALUES('get_admin'),('get_admin_treasury'),('get_all_reward_level'),('get_all_user_nft_reward'),('get_all_users'),('get_authenticate_user'),('get_badges'),
('get_constant'),('get_from_user_nft_reward'),('get_hightier_users'),('get_lowtier_users'),('get_nft'),('get_nft_purchased_by_low_tier'),
('get_reward_level'),('get_undistributed_bonus'),('get_undistributed_rewards'),('get_unprocessed'),('get_user_badges_and_criteria'),('update_reward_status'),
('get_user'),('get_user_name_using_reward_trx_hash'),('get_user_nft'),('get_user_nft_reward'),('get_unprocessed_direct_sale'),('get_immediate_hightier_users'),
('get_user_nft_direct_reward'),('get_from_user_nft_direct_reward'),('get_user_nft_indirect_reward'),('get_from_user_nft_indirect_reward'),('get_hightier_users_upto_five'),
('get_all_direct_reward_due_notification'),('get_all_direct_reward_received_notification'),('get_all_indirect_reward_due_notification'),('get_all_indirect_reward_received_notification'),
('get_all_nft_purchased_notification'), ('get_all_bonus_due_notification'),('get_all_bonus_received_notification'),('get_all_badges_upgrade_notification'),('get_badge_by_id'),
('post_nft'),('post_register_user'),('post_user_badges'),('post_user_nft'),('post_user_nft_reward'),('put_reward_level_by_id'),('put_user_badge_status_by_id'),('post_user_notification'),
('put_user_by_user_id'),('put_user_nft_by_trx_id'),('put_user_nft_reward_status_by_user_id'),('put_admin_treasury_by_user_id'),('put_user_nft_reward_by_id')) AS tbl(proname)
) t1 left join pg_proc t2 on t1.proname = t2.proname where t2.proname is null
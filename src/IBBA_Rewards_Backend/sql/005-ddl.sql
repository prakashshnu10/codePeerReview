CREATE TABLE public.t_user_notifications (
    notification_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    t_user_nft_reward_id uuid NULL,
    t_user_badges_id uuid NULL,
    t_user_nft_id uuid NULL,
    type varchar(255) NOT NULL,
    reward_status varchar(255) NOT NULL,
    bonus_status varchar(255) NOT NULL,
    read_status varchar(255) NULL,
    created_at timestamp NULL,
    updated_at timestamp NULL,
    created_by varchar(255) NULL,
    updated_by varchar(255) NULL
);


----------------------------------------------

ALTER TABLE t_user_notifications
ALTER COLUMN bonus_status DROP NOT NULL;

---------------------------------------

ALTER TABLE t_user_notifications
ALTER COLUMN reward_status DROP NOT NULL;

-------------------------------

ALTER TABLE public.t_user_nft_reward
ADD COLUMN notification boolean DEFAULT false;

-----------------------

INSERT INTO m_constants (constant, created_at)
VALUES ('notification', NOW());

----------------------

ALTER TABLE m_badges
ADD image character varying(255) COLLATE pg_catalog."default";

-----------------------

ALTER TABLE public.t_user_badges
ADD COLUMN notification boolean DEFAULT false;


------------------------------------

ALTER TABLE public.t_user_nft
ADD COLUMN notification boolean DEFAULT false;

------------------------------
update t_user_nft_reward set notification = true;

----------------------------
update t_user_badges set notification = true;

----------------------------

update t_user_nft set notification = true;


----------------------
INSERT INTO m_constants (constant, created_at)
VALUES ('badge_id', NOW());

----------------

update m_badges set image = 'https://firebasestorage.googleapis.com/v0/b/merkle-tree-78c0e.appspot.com/o/images%2Fbadges%2Felite.png?alt=media'
where badge = 'Elite Member';
update m_badges set image = 'https://firebasestorage.googleapis.com/v0/b/merkle-tree-78c0e.appspot.com/o/images%2Fbadges%2Fbronze.png?alt=media'
where badge = 'Bronze Member';
update m_badges set image = 'https://firebasestorage.googleapis.com/v0/b/merkle-tree-78c0e.appspot.com/o/images%2Fbadges%2Fsilver.png?alt=media'
where badge = 'Silver Member';
update m_badges set image = 'https://firebasestorage.googleapis.com/v0/b/merkle-tree-78c0e.appspot.com/o/images%2Fbadges%2Fgold.png?alt=media'
where badge = 'Gold Member';
update m_badges set image = 'https://firebasestorage.googleapis.com/v0/b/merkle-tree-78c0e.appspot.com/o/images%2Fbadges%2Fsenior.png?alt=media'
where badge = 'Senior Member';
update m_badges set image = 'https://firebasestorage.googleapis.com/v0/b/merkle-tree-78c0e.appspot.com/o/images%2Fbadges%2Fexecutive.png?alt=media'
where badge = 'Executive Member';










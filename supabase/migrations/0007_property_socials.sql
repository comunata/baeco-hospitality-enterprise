-- Admin-editable social links, shown in the footer/contact page when set.
alter table properties add column if not exists instagram text;
alter table properties add column if not exists facebook text;

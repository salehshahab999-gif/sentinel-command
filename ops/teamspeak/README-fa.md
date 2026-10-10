# Sentinel TeamSpeak 3 roles v2

این تغییر برای پروژه Sentinel Command Center، ۲۹ پروفایل مجوز TeamSpeak 3 تعریف می‌کند. پروفایل‌ها از گروه Normal یا Server Admin کپی نمی‌شوند. build-roles.cjs مشخصات فشرده را به ۱۲۱۵ مجوز صریح تبدیل می‌کند و validate-roles.cjs ساختار، آستانه‌ها و تفکیک اختیارات را بررسی می‌کند.

## نقش‌ها

- مدیریت: SENTINEL OWNER، SYSTEM ADMIN، PERMISSION AUDITOR
- نظارت: SECURITY MODERATOR، HEAD MODERATOR، MODERATOR، JUNIOR MODERATOR
- نقش‌های محدود: KICK-ONLY، BAN-ONLY، MOVE-ONLY
- عملیات: OPERATIONS LEAD، CHANNEL MANAGER
- اعضا و تحلیل: SENIOR ANALYST، ANALYST، RESEARCHER، REGISTERED MEMBER، VIP / SUPPORTER
- تخصص‌ها: SATELLITE / SAR، OSINT / GEOINT، MARITIME / AIS، AIRSPACE / ADS-B، ENERGY / MARKETS / DATA LAB
- محافظت افزونه: NO-KICK PROTECTED، NO-BAN PROTECTED، NO-MOVE PROTECTED
- گروه‌های کانالی: SENTINEL CHANNEL ADMIN، SENTINEL CHANNEL MODERATOR، SENTINEL EVENT HOST، SENTINEL PRESENTER

## مدل مجوز

Power توان انجام عمل است؛ Needed Power آستانهٔ هدف و Grant اجازهٔ تغییر خود مجوز است. برابری Power و Needed Power برای عمل کافی است؛ بنابراین آستانه‌های رنک‌ها جدا تنظیم شده‌اند. Channel Groupها در محدودهٔ کانال اعمال می‌شوند و می‌توانند روی مجوزهای Server Group اثر بگذارند.

آستانه‌های Join Power و Talk Power وقتی رفتار متفاوت ایجاد می‌کنند که تنظیم Needed Join/Talk Power خود کانال نیز متناسب پیکربندی شده باشد. سه نقش محافظتی افزونه هستند و باید کنار رنک اصلی تخصیص داده شوند. NO-BAN PROTECTED مجوز ساخت قانون Ban در گروه‌های دیگر را خنثی نمی‌کند.

## اجرا و ایمنی

GitHub Actions فقط اعتبارسنجی آفلاین مشخصات را اجرا می‌کند و به ServerQuery محلی رایانه دسترسی ندارد.

برای اعمال روی سرور محلی، همهٔ فایل‌های این پوشه را نگه دار، Node.js را نصب داشته باش و در PowerShell اجرا کن:

    powershell -ExecutionPolicy Bypass -File .\apply-sentinel-roles-v2.ps1

اسکریپت ابتدا فهرست نقش‌ها را نشان می‌دهد، سپس عبارت دقیق APPLY SENTINEL ROLE PROFILES V2 را می‌خواهد. رمز ServerQuery را به‌صورت مخفی می‌گیرد. پیش از تغییر، از Permissionهای گروه‌های Sentinel موجود snapshot ذخیره می‌کند؛ گروه‌های داخلی و عضویت کاربران را تغییر نمی‌دهد و OWNER را خودکار به هیچ حسابی اختصاص نمی‌دهد. گروه‌های Sentinel هم‌نام به‌طور کامل با همین مشخصات جایگزین می‌شوند. اسکریپت هنوز روی سرور زنده آزمایش نشده است؛ قبل از اجرا باید آمادهٔ بازپیکربندی همان گروه‌های هم‌نام باشی.

## منابع

- مستندات رسمی Permission System: https://github.com/TeamspeakDocs/Server/blob/master/doc/permissiondoc.txt
- مستندات رسمی ServerQuery: https://github.com/TeamspeakDocs/Server/tree/master/serverquerydocs
- نمونه‌های پیش‌فرض رسمی: https://github.com/teamspeak/dotfiles/blob/main/defaults.sql
- انجمن TeamSpeak درباره Grant / Skip / Negate: https://community.teamspeak.com/t/grant-skip-negate/40863
- بحث انجمن درباره آستانه‌های عددی دسترسی: https://community.teamspeak.com/t/lock-channel-groups-for-accessing-server-groups/64318
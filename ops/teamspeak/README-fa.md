# Sentinel TeamSpeak 3 roles v2

این تغییر برای پروژه Sentinel Command Center، ۲۹ پروفایل مجوز TeamSpeak 3 تعریف می‌کند. پروفایل‌ها از گروه Normal یا Server Admin کپی نمی‌شوند. build-roles.cjs مجوزها را از مشخصات فشرده می‌سازد و validate-roles.cjs ساختار، آستانه‌ها، مدل دسترسی سلسله‌مراتبی و تفکیک اختیارات را بررسی می‌کند. نقشهٔ ۳۳ کانال در `channel-thresholds-v1.json` نگهداری می‌شود.

## نقش‌ها

- مدیریت: SENTINEL OWNER، SYSTEM ADMIN، PERMISSION AUDITOR
- نظارت: SECURITY MODERATOR، HEAD MODERATOR، MODERATOR، JUNIOR MODERATOR
- نقش‌های محدود: KICK-ONLY، BAN-ONLY، MOVE-ONLY
- عملیات: OPERATIONS LEAD، CHANNEL MANAGER
- اعضا و تحلیل: SENIOR ANALYST، ANALYST، RESEARCHER، REGISTERED MEMBER، VIP / SUPPORTER
- تخصص‌ها: SATELLITE / SAR، OSINT / GEOINT، MARITIME / AIS، AIRSPACE / ADS-B، ENERGY / MARKETS / DATA LAB
- محافظت افزونه: NO-KICK PROTECTED، NO-BAN PROTECTED، NO-MOVE PROTECTED
- گروه‌های کانالی: SENTINEL CHANNEL ADMIN، SENTINEL CHANNEL MODERATOR، SENTINEL EVENT HOST، SENTINEL PRESENTER

## مدل واقعی ترکیب مجوزها

- **Server Groupها با هم جمع می‌شوند:** برای مجوزهای معمولی، بالاترین مقدار میان گروه‌های سروری کاربر مؤثر است. اگر برای همان مجوز مقدار Negate وجود داشته باشد، منطق Negate مستندات TeamSpeak اعمال می‌شود. بنابراین افزودن گروه تخصصی معمولاً قدرت رتبهٔ اصلی را کم نمی‌کند؛ ممکن است مقدار Join/Talk مؤثر را بالا ببرد.
- **گروه پیش‌فرض Normal:** اگر کاربر عضو Default Server Group باشد، با انتساب یک گروه سروری جدید، عضویت پیش‌فرضش خودکار برداشته می‌شود. اسکریپت عضویت هیچ کاربری را تغییر نمی‌دهد و گروه‌های داخلی را دست‌کاری نمی‌کند.
- **Join Power و Talk Power به‌تنهایی درِ اتاق را قفل نمی‌کنند:** برای محدودیت ورود، خود کانال باید `i_channel_needed_join_power` داشته باشد؛ برای محدودیت صحبت، کانال باید `i_client_needed_talk_power` را تنظیم کرده باشد. این اسکریپت آستانه‌های کانال‌های موجود را پیکربندی نمی‌کند، پس فقط با نصب رتبه‌ها سلسله‌مراتب دسترسی اتاق‌ها ساخته نمی‌شود.
- **Channel Group لایهٔ بالاتری است:** طبق مستندات TeamSpeak می‌تواند مقادیر Server Group را جایگزین کند. در این مدل، قدرت‌های `i_channel_join_power` و `i_client_talk_power` در Server Groupهای اصلی با `skip=1` محافظت می‌شوند؛ بنابراین گروه کانالی نمی‌تواند سلسله‌مراتب ورود یا صحبت رتبه را دور بزند. گروه‌های کانالی فقط اختیارات مدیریت محدود همان کانال را می‌دهند و قدرت ورود/صحبت اضافه نمی‌کنند.
- **نقش‌های تخصصی افزونه‌اند:** SATELLITE / SAR، OSINT / GEOINT، MARITIME / AIS، AIRSPACE / ADS-B و ENERGY / MARKETS / DATA LAB شناسهٔ تخصص و توان Join/Talk تکمیلی‌اند؛ به‌تنهایی نقش منع دسترسی نیستند.
- **محافظت‌ها:** NO-KICK PROTECTED، NO-BAN PROTECTED و NO-MOVE PROTECTED باید کنار نقش اصلی قرار بگیرند. NO-BAN PROTECTED مجوز ساخت قانون Ban در گروه‌های دیگر را خنثی نمی‌کند.

## نقشهٔ دسترسی سلسله‌مراتبی

فایل `channel-thresholds-v1.json` برای تمام ۳۳ کانال آستانهٔ ورود و صحبت تعیین می‌کند. لابی ۰/۰ است؛ اتاق‌های Satellite از ۱۰/۱۰، OSINT از ۱۵/۱۴، Maritime از ۲۰/۱۶، Airspace از ۲۵/۱۸ و Energy از ۳۰/۲۰ استفاده می‌کنند. مقدار مرز شامل رتبه‌ای است که قدرتش دقیقاً برابر آستانه باشد.

پنج نقش تخصصی همچنان انحصاری نیستند؛ قدرت Join/Talk آن‌ها به‌صورت افزونه در محاسبهٔ گروه‌های Server اعمال می‌شود. این نقشه تا وقتی نقش‌ها به اعضای موردنظر تخصیص داده نشوند محدودیت مؤثری برای اعضایی که هنوز در گروه پیش‌فرض `Normal` هستند ایجاد نمی‌کند. اسکریپت تنظیم کانال‌ها فقط دو تنظیم هر کانال را تغییر می‌دهد: `i_channel_needed_join_power` و `channel_needed_talk_power`. قبل از نوشتن، از مقدارهای قبلی نسخهٔ پشتیبان می‌گیرد و در صورت خطا تلاش می‌کند آن‌ها را برگرداند.

## اجرا و ایمنی

GitHub Actions فقط اعتبارسنجی آفلاین مشخصات و مدل ترکیب لایه‌ها را اجرا می‌کند و به ServerQuery محلی رایانه دسترسی ندارد. موفقیت این تست‌ها رفتار سرور زنده را تضمین نمی‌کند.

برای اعمال روی سرور محلی، همهٔ فایل‌های این پوشه را نگه دار، Node.js را نصب داشته باش و در PowerShell اجرا کن:

    powershell -ExecutionPolicy Bypass -File .\apply-sentinel-roles-v2.ps1

اسکریپت ابتدا فهرست نقش‌ها را نشان می‌دهد، سپس عبارت دقیق APPLY SENTINEL ROLE PROFILES V2 را می‌خواهد. رمز ServerQuery را به‌صورت مخفی می‌گیرد. پیش از تغییر، از Permissionهای گروه‌های Sentinel موجود snapshot ذخیره می‌کند؛ گروه‌های داخلی و عضویت کاربران را تغییر نمی‌دهد و OWNER را خودکار به هیچ حسابی اختصاص نمی‌دهد. گروه‌های Sentinel هم‌نام به‌طور کامل با همین مشخصات جایگزین می‌شوند. اسکریپت هنوز روی سرور زنده آزمایش نشده است؛ قبل از اجرا باید آمادهٔ بازپیکربندی همان گروه‌های هم‌نام باشی. چون گروه Server Admin داخلی و عضویت‌های کاربران دست‌نخورده می‌مانند، این طراحی به معنی «فقط یک حساب در کل سرور می‌تواند مجوزها را تغییر دهد» نیست؛ اعضای فعلی Server Admin همچنان اختیارات گروه داخلی خود را دارند.

## منابع

- مستندات رسمی Permission System: https://github.com/TeamspeakDocs/Server/blob/master/doc/permissiondoc.txt
- مستندات رسمی ServerQuery: https://github.com/TeamspeakDocs/Server/tree/master/serverquerydocs
- نمونه‌های پیش‌فرض رسمی: https://github.com/teamspeak/dotfiles/blob/main/defaults.sql
- انجمن TeamSpeak درباره Grant / Skip / Negate: https://community.teamspeak.com/t/grant-skip-negate/40863
- بحث انجمن درباره آستانه‌های عددی دسترسی: https://community.teamspeak.com/t/lock-channel-groups-for-accessing-server-groups/64318
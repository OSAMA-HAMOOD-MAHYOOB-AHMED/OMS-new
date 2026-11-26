using Dapper;
using Oms.Api.Data;

namespace Oms.Api.Catalog;

/// <summary>
/// Arabic descriptions for the store's products, written to read naturally rather than word for word.
/// Filled once, and only where the product still has the English text they were written for, so an
/// admin's own edits are never paired with a description of something else.
/// </summary>
public static class ArabicDescriptions
{
    private static readonly (string Id, string En, string Ar)[] Texts =
    [
        ("CAS-001",
         "Military-grade drop protection with crystal-clear back. Raised bezels protect screen and camera. Easy access to all ports and buttons.",
         "حماية من السقوط بمعايير عسكرية مع ظهر شفاف يُبرز لون جوالك. الحواف البارزة تحمي الشاشة والكاميرا، مع وصول سهل لكل المنافذ والأزرار."),
        ("CAS-002",
         "Multi-layer protection with port covers to block dust and debris. Built-in screen protector. Includes belt-clip holster doubles as kickstand.",
         "حماية بعدة طبقات مع أغطية للمنافذ تمنع دخول الغبار والأتربة، وواقي شاشة مدمج. يأتي مع حامل للحزام يتحول إلى مسند تضع عليه الجوال."),
        ("CAS-003",
         "Shockproof bumper corners with clear back panel. MagSafe compatible. Yellowing-resistant polycarbonate keeps your case looking new.",
         "زوايا مقاومة للصدمات مع ظهر شفاف، ومتوافق مع MagSafe. مصنوع من بولي كربونات مقاوم للاصفرار، فيبقى الكفر كأنه جديد."),
        ("CAS-004",
         "Crystal clear PC back with TPU bumper. Includes scratch-resistant back panel. Compatible with wireless charging. Camera lens protection.",
         "ظهر شفاف صلب مع إطار مرن يمتص الصدمات، ولوح خلفي مقاوم للخدوش. يدعم الشحن اللاسلكي ويحمي عدسات الكاميرا."),
        ("CAS-005",
         "Military-grade drop protection with textured grip pattern. Dual-layer protection. MagSafe compatible. Available in matte black and graphite.",
         "حماية من السقوط بمعايير عسكرية بطبقتين، مع ملمس محبّب يمنع انزلاق الجوال من يدك. متوافق مع MagSafe، ومتوفر بالأسود المطفي والرمادي الداكن."),
        ("CHR-001",
         "Compact 65W GaN charger supports USB-C Power Delivery. Charges laptops, tablets, and phones. Foldable plug for easy travel.",
         "شاحن صغير بقوة 65 واط بتقنية GaN يدعم الشحن السريع USB-C Power Delivery. يشحن اللابتوب والتابلت والجوال، وقابسه ينطوي ليسهل حمله في السفر."),
        ("CHR-002",
         "Official Samsung 45W adapter with USB-C port. Compatible with Galaxy S and Note series. Supports Super Fast Charging 2.0.",
         "شاحن سامسونج الأصلي بقوة 45 واط بمنفذ USB-C، متوافق مع أجهزة Galaxy S وNote، ويدعم الشحن فائق السرعة 2.0."),
        ("CHR-003",
         "20W USB-C wall charger with Power Delivery. Fast charges iPhone 12 and later from 0 to 50% in 30 minutes.",
         "شاحن جداري USB-C بقوة 20 واط يدعم Power Delivery، يشحن iPhone 12 وما بعده من 0 إلى 50% في حوالي 30 دقيقة."),
        ("CHR-004",
         "4-port GaN charger (2x USB-C, 2x USB-A) delivering up to 100W total. Charge a laptop, tablet, and two phones simultaneously.",
         "شاحن GaN بأربعة منافذ (2 USB-C و2 USB-A) بقدرة إجمالية تصل إلى 100 واط، تشحن منه اللابتوب والتابلت وجوالين في نفس الوقت."),
        ("CHR-005",
         "Original Apple 20W USB-C adapter for fast charging iPhone and iPad. Works with USB-C to Lightning and USB-C cables.",
         "شاحن أبل الأصلي USB-C بقوة 20 واط للشحن السريع لأجهزة iPhone وiPad، ويعمل مع كابلات USB-C إلى Lightning وكابلات USB-C."),
        ("EAR-001",
         "Premium wireless earbuds with Intelligent ANC, 360° Audio, and ergonomic fit. Up to 8 hours battery with ANC on.",
         "سماعات لاسلكية فاخرة بعزل ذكي للضوضاء وصوت محيطي 360 درجة، بتصميم مريح يثبت في الأذن. تدوم حتى 8 ساعات مع تشغيل العزل."),
        ("EAR-002",
         "Hybrid active noise cancellation with 3 adjustable levels. 11mm drivers for deep bass. IPX5 water resistant. 35-hour total playtime.",
         "عزل نشط هجين للضوضاء بثلاثة مستويات تختار منها، ومشغلات 11 ملم لصوت جهير عميق. مقاومة للماء بمعيار IPX5، وتشغيل يصل إلى 35 ساعة مع العلبة."),
        ("EAR-003",
         "True adaptive noise cancellation with JBL Pure Bass Sound. 4-mic clear call technology. Up to 40 hours total playtime.",
         "عزل ضوضاء يتكيّف مع المكان حولك مع صوت JBL Pure Bass، وأربعة ميكروفونات لمكالمات واضحة. تشغيل يصل إلى 40 ساعة مع العلبة."),
        ("EAR-004",
         "Sony's digital noise cancellation with 360° Audio support. Comfortable open-fit design. Up to 15 hours battery life.",
         "عزل رقمي للضوضاء من سوني مع دعم الصوت المحيطي 360، بتصميم خفيف ومريح للاستخدام الطويل. بطارية تدوم حتى 15 ساعة."),
        ("EAR-005",
         "Active noise cancellation up to 43dB. 10mm dynamic drivers with Hi-Res Audio. Bluetooth 5.3. IPX4 splash resistant.",
         "عزل نشط للضوضاء يصل إلى 43 ديسيبل، ومشغلات 10 ملم بصوت عالي الدقة Hi-Res. بلوتوث 5.3، ومقاومة للرذاذ بمعيار IPX4."),
        ("P-CASE-01",
         "Clear protective phone case",
         "كفر شفاف يحمي جوالك من الخدوش والصدمات اليومية، ويبقى لون جوالك وتصميمه ظاهرين."),
        ("P-CHARGER-01",
         "USB-C fast charger 20W",
         "شاحن سريع USB-C بقوة 20 واط، مناسب للشحن اليومي لأغلب الجوالات الحديثة."),
        ("P-EARPH-01",
         "Bluetooth earphones",
         "سماعات بلوتوث لاسلكية للموسيقى والمكالمات بدون أسلاك."),
        ("P-PBANK-01",
         "Compact 10,000mAh power bank",
         "باور بانك صغير بسعة 10,000 ملي أمبير، سهل الحمل ويشحن جوالك أكثر من مرة."),
        ("PWR-001",
         "20000mAh high-capacity slim design. Dual USB-A ports + USB-C input/output. PowerIQ technology for fast charging. Charges iPhone 15 over 4 times.",
         "باور بانك نحيف بسعة كبيرة 20000 ملي أمبير، بمنفذي USB-A ومنفذ USB-C للشحن والإخراج. تقنية PowerIQ للشحن السريع، ويشحن iPhone 15 أكثر من 4 مرات."),
        ("PWR-002",
         "30000mAh massive capacity with 65W max output. Charges laptops, tablets, and phones. Built-in USB-C cable. LED power display.",
         "سعة ضخمة 30000 ملي أمبير مع قدرة إخراج تصل إلى 65 واط، يشحن اللابتوب والتابلت والجوال. فيه كابل USB-C مدمج وشاشة تعرض نسبة الشحن المتبقية."),
        ("PWR-003",
         "Compact 10000mAh power bank with dual USB-A and USB-C ports. 22.5W fast charging. Pocket-sized lightweight aluminum body.",
         "باور بانك صغير بسعة 10000 ملي أمبير بمنفذي USB-A ومنفذ USB-C، يدعم الشحن السريع بقوة 22.5 واط. هيكل ألمنيوم خفيف يدخل الجيب بسهولة."),
        ("PWR-004",
         "10000mAh with USB-C and USB-A ports. Pass-through charging lets you charge the bank and a device simultaneously. Soft-touch finish.",
         "سعة 10000 ملي أمبير بمنفذ USB-C ومنفذ USB-A. يدعم الشحن المتزامن، فتشحن الباور بانك وجوالك في نفس الوقت، بملمس ناعم."),
        ("PWR-005",
         "90W USB-C output charges laptops and MacBooks at full speed. 26800mAh capacity. Three simultaneous outputs. Smart power distribution.",
         "منفذ USB-C بقوة 90 واط يشحن اللابتوب وأجهزة MacBook بأقصى سرعة، بسعة 26800 ملي أمبير وثلاثة منافذ تعمل معًا مع توزيع ذكي للطاقة."),
    ];

    public static async Task FillOnceAsync(WebApplication app)
    {
        var factory = app.Services.GetRequiredService<IDbConnectionFactory>();
        using var conn = factory.Create();
        conn.Open();
        using var tx = conn.BeginTransaction();
        await conn.ExecuteAsync("LOCK TABLE site_setting IN EXCLUSIVE MODE;", transaction: tx);
        var done = await conn.ExecuteScalarAsync<string?>(
            "SELECT value FROM site_setting WHERE key = 'arabicDescriptions';", transaction: tx);
        if (done is not null)
        {
            tx.Rollback();
            return;
        }

        var updated = 0;
        foreach (var (id, en, ar) in Texts)
        {
            updated += await conn.ExecuteAsync("""
                UPDATE product SET descriptionar = @ar
                WHERE productid = @id AND descriptionar IS NULL AND btrim(description) = @en;
                """, new { id, en, ar }, tx);
        }

        await conn.ExecuteAsync(
            "INSERT INTO site_setting (key, value) VALUES ('arabicDescriptions', NOW()::text);", transaction: tx);
        tx.Commit();
        app.Logger.LogWarning("Added Arabic descriptions to {Count} products", updated);
    }
}

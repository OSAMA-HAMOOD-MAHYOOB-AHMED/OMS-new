using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Oms.Api.Invoicing;

/// <summary>
/// One-page bilingual (English / Arabic) invoice. Every heading and label is shown in both
/// languages side by side; names, numbers and amounts appear once.
/// </summary>
public sealed class InvoicePdfGenerator(IWebHostEnvironment env, ILogger<InvoicePdfGenerator> logger)
{
    // Brand palette from the logo (matches the website and the app).
    private static readonly Color Ink = Color.FromHex("#141414");
    private static readonly Color Gold = Color.FromHex("#B8914F");
    private static readonly Color GoldText = Color.FromHex("#85652A");
    private static readonly Color Sand = Color.FromHex("#F6EFE1");
    private static readonly Color Muted = Color.FromHex("#6B6459");
    private static readonly Color Border = Color.FromHex("#ECE6DA");
    private static readonly Color SoftBg = Color.FromHex("#FAF8F4");
    private static readonly Color Success = Color.FromHex("#1F7A4D");
    private static readonly Color HeaderSubtext = Color.FromHex("#CFC7B8");

    // Covers both Arabic and Latin, so one family serves the whole page.
    private const string FontFamily = "IBM Plex Sans Arabic";
    private static readonly object FontLock = new();
    private static bool _fontsRegistered;

    /// <summary>Card orders are paid at checkout; cash orders only once delivered.</summary>
    private static bool IsPaid(InvoiceDocumentData d) =>
        !string.Equals(d.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase)
            ? !string.Equals(d.PaymentStatus, "Failed", StringComparison.OrdinalIgnoreCase)
            : string.Equals(d.OrderStatus, "Delivered", StringComparison.OrdinalIgnoreCase)
              || string.Equals(d.PaymentStatus, "Completed", StringComparison.OrdinalIgnoreCase)
              || string.Equals(d.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase);

    public byte[] Generate(InvoiceDocumentData data, string currencyCode = "USD", decimal exchangeRate = 1m) =>
        Build(data, currencyCode, exchangeRate).GeneratePdf();

    /// <summary>The invoice as a QuestPDF document (PDF bytes via <see cref="Generate"/>).</summary>
    public IDocument Build(InvoiceDocumentData data, string currencyCode = "USD", decimal exchangeRate = 1m)
    {
        EnsureFonts();
        var logoBytes = TryLoadAsset("logo.jpg");
        string Fmt(decimal usd) => currencyCode == "USD"
            ? $"${usd:F2}"
            : $"{currencyCode} {usd * exchangeRate:N2}";

        return Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(32);
                page.DefaultTextStyle(x => x.FontFamily(FontFamily).FontSize(9.5f).FontColor(Ink));

                page.Header().Element(c => ComposeHeader(c, data, logoBytes));
                page.Content().PaddingTop(10).Element(c => ComposeContent(c, data, Fmt));
                page.Footer().PaddingTop(6).Element(ComposeFooter);
            });
        });
    }

    // ---------- Assets ----------

    private void EnsureFonts()
    {
        if (_fontsRegistered) return;
        lock (FontLock)
        {
            if (_fontsRegistered) return;
            foreach (var file in new[]
                     {
                         "IBMPlexSansArabic_400Regular.ttf",
                         "IBMPlexSansArabic_600SemiBold.ttf",
                         "IBMPlexSansArabic_700Bold.ttf",
                     })
            {
                var bytes = TryLoadAsset(Path.Combine("Fonts", file));
                if (bytes is null)
                {
                    logger.LogWarning("Invoice font {File} not found; Arabic text may not render", file);
                    continue;
                }
                using var stream = new MemoryStream(bytes);
                FontManager.RegisterFont(stream);
            }
            _fontsRegistered = true;
        }
    }

    private byte[]? TryLoadAsset(string relativePath)
    {
        var candidates = new[]
        {
            Path.Combine(env.ContentRootPath, "Assets", relativePath),
            Path.Combine(AppContext.BaseDirectory, "Assets", relativePath),
        };

        foreach (var path in candidates)
        {
            if (!File.Exists(path)) continue;
            try
            {
                return File.ReadAllBytes(path);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Unable to read invoice asset at {Path}", path);
            }
        }

        return null;
    }

    // ---------- Layout ----------

    private static void ComposeHeader(IContainer container, InvoiceDocumentData data, byte[]? logoBytes)
    {
        container.Column(column =>
        {
            column.Item().Background(Ink).PaddingVertical(16).PaddingHorizontal(18).Row(row =>
            {
                row.RelativeItem().Row(inner =>
                {
                    if (logoBytes is not null)
                    {
                        inner.ConstantItem(58).Height(58).Background(Colors.White).Padding(4).Image(logoBytes).FitArea();
                        inner.ConstantItem(12);
                    }

                    inner.RelativeItem().Column(brand =>
                    {
                        brand.Item().Text("Al-Wakeel Al-Shamel").FontSize(16).Bold().FontColor(Colors.White);
                        brand.Item().Text("الوكيل الشامل").FontSize(13).Bold().FontColor(Colors.White);
                        brand.Item().PaddingTop(2).Text("Phone accessories · إكسسوارات الجوال").FontSize(9).FontColor(Gold);
                        brand.Item().Text("Riyadh, Saudi Arabia · الرياض، المملكة العربية السعودية")
                            .FontSize(8).FontColor(HeaderSubtext);
                    });
                });

                row.ConstantItem(210).AlignRight().Column(right =>
                {
                    right.Item().AlignRight().Text("INVOICE").FontSize(22).Bold().FontColor(Gold);
                    right.Item().AlignRight().Text("فاتورة").FontSize(18).Bold().FontColor(Gold);
                    right.Item().AlignRight().PaddingTop(4).Text(data.OrderId).FontSize(8.5f).SemiBold().FontColor(Colors.White);
                    right.Item().AlignRight().Text(data.OrderDate.ToString("dd MMM yyyy, HH:mm 'UTC'"))
                        .FontSize(8.5f).FontColor(HeaderSubtext);
                });
            });

            column.Item().Height(4).Background(Gold);
        });
    }

    private static void ComposeContent(IContainer container, InvoiceDocumentData data, Func<decimal, string> fmt)
    {
        var paid = IsPaid(data);
        var isCash = string.Equals(data.PaymentMethod, "Cash", StringComparison.OrdinalIgnoreCase);

        container.Column(column =>
        {
            column.Spacing(9);

            // Payment state, in both languages.
            column.Item().Row(row =>
            {
                row.AutoItem()
                    .Background(paid ? Color.FromHex("#E6F2EC") : Sand)
                    .PaddingVertical(4).PaddingHorizontal(12)
                    .Text(paid ? "PAID · مدفوعة" : "PAYMENT DUE ON DELIVERY · الدفع عند الاستلام")
                    .FontSize(9).Bold().FontColor(paid ? Success : GoldText);
                row.RelativeItem();
            });

            // Bill to.
            column.Item().Element(c => Card(c, "Bill To", "فاتورة إلى", stack =>
            {
                stack.Item().Row(r =>
                {
                    r.RelativeItem().Column(left =>
                    {
                        left.Item().Text(data.CustomerName).FontSize(11).SemiBold();
                        left.Item().Text(data.CustomerAddress).FontColor(Muted);
                    });
                    r.RelativeItem().AlignRight().Column(right =>
                    {
                        right.Item().AlignRight().Text(data.CustomerEmail).FontColor(Muted);
                        right.Item().AlignRight().Text(data.CustomerPhone).FontColor(Muted);
                    });
                });
            }));

            // Order and shipping details, side by side.
            column.Item().Row(row =>
            {
                row.RelativeItem().Element(c => Card(c, "Order Details", "تفاصيل الطلب", stack =>
                {
                    Detail(stack, "Order number", "رقم الطلب", data.OrderId);
                    Detail(stack, "Order date", "تاريخ الطلب", data.OrderDate.ToString("dd MMM yyyy"));
                    var (statusEn, statusAr) = OrderStatus(data.OrderStatus);
                    Detail(stack, "Order status", "حالة الطلب", statusEn, statusAr);
                    var (methodEn, methodAr) = PaymentMethod(data.PaymentMethod);
                    Detail(stack, "Payment method", "طريقة الدفع", methodEn, methodAr);
                    Detail(stack, "Payment status", "حالة الدفع",
                        paid ? "Paid" : "Due on delivery",
                        paid ? "مدفوعة" : "تُدفع عند الاستلام");
                    if (!string.IsNullOrWhiteSpace(data.TransactionReference))
                        Detail(stack, "Transaction ref.", "مرجع العملية", data.TransactionReference);
                }));

                row.ConstantItem(12);

                row.RelativeItem().Element(c => Card(c, "Shipping", "الشحن", stack =>
                {
                    Detail(stack, "Carrier", "شركة الشحن", data.ShippingCarrier);
                    Detail(stack, "Service", "الخدمة", data.ShippingService);
                    var (costEn, costAr) = Translate(data.ShippingCostLabel);
                    Detail(stack, "Shipping cost", "تكلفة الشحن", costEn, costAr);
                    var (etaEn, etaAr) = Translate(data.ShippingEstimatedDelivery);
                    Detail(stack, "Estimated delivery", "موعد التوصيل المتوقع", etaEn, etaAr);
                    Detail(stack, "Tracking number", "رقم التتبّع", data.ShippingTrackingNumber);
                }));
            });

            // Line items.
            column.Item().Element(c => Card(c, "Items", "المنتجات", stack =>
            {
                stack.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(26);
                        columns.RelativeColumn(4);
                        columns.ConstantColumn(56);
                        columns.ConstantColumn(78);
                        columns.ConstantColumn(82);
                    });

                    table.Header(header =>
                    {
                        static IContainer HeaderCell(IContainer c) =>
                            c.DefaultTextStyle(x => x.SemiBold().FontColor(Colors.White).FontSize(8.5f))
                                .Background(Ink)
                                .PaddingVertical(5)
                                .PaddingHorizontal(6);

                        header.Cell().Element(HeaderCell).Text("#");
                        header.Cell().Element(HeaderCell).Element(c => HeaderLabel(c, "Product", "المنتج", left: true));
                        header.Cell().Element(HeaderCell).Element(c => HeaderLabel(c, "Qty", "الكمية"));
                        header.Cell().Element(HeaderCell).Element(c => HeaderLabel(c, "Unit price", "سعر الوحدة"));
                        header.Cell().Element(HeaderCell).Element(c => HeaderLabel(c, "Subtotal", "المجموع"));
                    });

                    var index = 1;
                    foreach (var item in data.Items)
                    {
                        var shaded = index % 2 == 0;
                        IContainer BodyCell(IContainer c) =>
                            c.Background(shaded ? SoftBg : Colors.White)
                                .BorderBottom(1).BorderColor(Border)
                                .PaddingVertical(6)
                                .PaddingHorizontal(6);

                        table.Cell().Element(BodyCell).Text(index.ToString()).FontColor(Muted);
                        table.Cell().Element(BodyCell).Column(col =>
                        {
                            col.Item().Text(item.Name).SemiBold();
                            col.Item().Text(item.ProductId).FontSize(7.5f).FontColor(Muted);
                        });
                        table.Cell().Element(BodyCell).AlignCenter().Text(item.Quantity.ToString());
                        table.Cell().Element(BodyCell).AlignRight().Text(fmt(item.UnitPrice));
                        table.Cell().Element(BodyCell).AlignRight().Text(fmt(item.Subtotal)).SemiBold();
                        index++;
                    }
                });
            }));

            // Totals.
            column.Item().AlignRight().Width(300).Element(totalCard =>
            {
                totalCard.Border(1).BorderColor(Gold).Background(SoftBg).Padding(10).Column(col =>
                {
                    TotalRow(col, "Subtotal", "المجموع الفرعي", fmt(data.TotalPrice));
                    var (costEn, costAr) = Translate(data.ShippingCostLabel);
                    TotalRow(col, "Shipping", "الشحن", costAr is null ? costEn : $"{costEn} · {costAr}", Success);
                    col.Item().PaddingVertical(6).LineHorizontal(1).LineColor(Border);
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text(paid ? "Total Paid" : "Amount Due").FontSize(11).Bold();
                        r.RelativeItem().AlignCenter().Text(paid ? "الإجمالي المدفوع" : "المبلغ المستحق").FontSize(11).Bold();
                        r.ConstantItem(96).AlignRight().Text(fmt(data.TotalPrice)).FontSize(13).Bold().FontColor(GoldText);
                    });
                });
            });

            // Closing note.
            column.Item().Column(note =>
            {
                note.Item().Text(paid
                        ? "This invoice confirms payment received for the order above. Please keep a copy for your records."
                        : isCash
                            ? "Please pay the amount due in cash when your order is delivered. Keep this invoice for your records."
                            : "Payment for this order is still pending. Keep this invoice for your records.")
                    .FontSize(8.5f).FontColor(Muted);
                note.Item().AlignRight().Text(paid
                        ? "تؤكد هذه الفاتورة استلام قيمة الطلب أعلاه. يرجى الاحتفاظ بنسخة منها."
                        : isCash
                            ? "يرجى دفع المبلغ المستحق نقدًا عند استلام الطلب، والاحتفاظ بهذه الفاتورة."
                            : "لم يكتمل دفع هذا الطلب بعد. يرجى الاحتفاظ بهذه الفاتورة.")
                    .FontSize(8.5f).FontColor(Muted);
            });
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().LineHorizontal(1).LineColor(Border);
            column.Item().PaddingTop(6).Row(row =>
            {
                row.RelativeItem().Text("Thank you for shopping with Al-Wakeel Al-Shamel.").FontSize(8.5f).FontColor(Muted);
                row.AutoItem().PaddingHorizontal(10).Text(text =>
                {
                    text.CurrentPageNumber().FontSize(8.5f).FontColor(Muted);
                    text.Span(" / ").FontSize(8.5f).FontColor(Muted);
                    text.TotalPages().FontSize(8.5f).FontColor(Muted);
                });
                row.RelativeItem().AlignRight().Text("شكرًا لتسوّقك من الوكيل الشامل.").FontSize(8.5f).FontColor(Muted);
            });
        });
    }

    // ---------- Building blocks ----------

    /// <summary>A bordered card whose title shows English on the left and Arabic on the right.</summary>
    private static void Card(IContainer container, string titleEn, string titleAr, Action<ColumnDescriptor> content)
    {
        container.Border(1).BorderColor(Border).Background(Colors.White).Padding(10).Column(column =>
        {
            column.Item().BorderBottom(1).BorderColor(Border).PaddingBottom(4).Row(r =>
            {
                r.RelativeItem().Text(titleEn).FontSize(10.5f).SemiBold().FontColor(GoldText);
                r.RelativeItem().AlignRight().Text(titleAr).FontSize(10.5f).SemiBold().FontColor(GoldText);
            });
            column.Item().PaddingTop(6).Column(content);
        });
    }

    /// <summary>A detail line: English label left, Arabic label right, value underneath.</summary>
    private static void Detail(ColumnDescriptor column, string labelEn, string labelAr, string value, string? valueAr = null)
    {
        column.Item().PaddingBottom(5).Column(item =>
        {
            item.Item().Row(r =>
            {
                r.RelativeItem().Text(labelEn).FontSize(7.5f).FontColor(Muted);
                r.RelativeItem().AlignRight().Text(labelAr).FontSize(7.5f).FontColor(Muted);
            });
            item.Item().Row(r =>
            {
                r.RelativeItem().Text(value).FontSize(9).SemiBold();
                if (valueAr is not null)
                    r.RelativeItem().AlignRight().Text(valueAr).FontSize(9).SemiBold();
            });
        });
    }

    private static void HeaderLabel(IContainer container, string en, string ar, bool left = false)
    {
        container.Column(c =>
        {
            var top = c.Item();
            var bottom = c.Item();
            if (left)
            {
                top.Text(en);
                bottom.Text(ar).FontSize(7.5f);
            }
            else
            {
                top.AlignRight().Text(en);
                bottom.AlignRight().Text(ar).FontSize(7.5f);
            }
        });
    }

    private static void TotalRow(ColumnDescriptor column, string en, string ar, string value, Color? valueColor = null)
    {
        column.Item().PaddingBottom(3).Row(r =>
        {
            r.RelativeItem().Text(en).FontColor(Muted);
            r.RelativeItem().AlignCenter().Text(ar).FontColor(Muted);
            r.ConstantItem(96).AlignRight().Text(value).FontColor(valueColor ?? Ink);
        });
    }

    // ---------- Arabic for stored values ----------

    private static (string En, string? Ar) PaymentMethod(string method) => method switch
    {
        "CreditCard" => ("Credit card", "بطاقة ائتمان"),
        "OnlineBanking" => ("Online banking", "تحويل بنكي"),
        "Cash" => ("Cash on delivery", "الدفع عند الاستلام"),
        _ => (method, null),
    };

    private static (string En, string? Ar) OrderStatus(string status)
    {
        var s = status.ToLowerInvariant();
        if (s.Contains("cancel")) return (status, "ملغي");
        if (s.Contains("deliver") || s.Contains("complete")) return (status, "تم التوصيل");
        if (s.Contains("ship")) return (status, "تم الشحن");
        if (s.Contains("process")) return (status, "قيد التجهيز");
        if (s.Contains("place") || s.Contains("pending")) return (status, "تم الطلب");
        return (status, null);
    }

    /// <summary>Arabic for the fixed shipping phrases the order service stores.</summary>
    private static (string En, string? Ar) Translate(string text) => text switch
    {
        "Free" => ("Free", "مجاني"),
        "3–5 business days" or "3-5 business days" => (text, "من 3 إلى 5 أيام عمل"),
        _ => (text, null),
    };
}

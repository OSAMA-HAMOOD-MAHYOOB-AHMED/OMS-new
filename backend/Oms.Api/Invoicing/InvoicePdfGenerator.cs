using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Oms.Api.Invoicing;

public sealed class InvoicePdfGenerator(IWebHostEnvironment env, ILogger<InvoicePdfGenerator> logger)
{
    private static readonly Color BrandBlue = Color.FromHex("#2563EB");
    private static readonly Color BrandDark = Color.FromHex("#0F172A");
    private static readonly Color Muted = Color.FromHex("#64748B");
    private static readonly Color Border = Color.FromHex("#E2E8F0");
    private static readonly Color SoftBg = Color.FromHex("#F8FAFC");
    private static readonly Color Success = Color.FromHex("#047857");
    private static readonly Color HeaderSubtext = Color.FromHex("#DBEAFE");

    public byte[] Generate(InvoiceDocumentData data)
    {
        var logoBytes = TryLoadLogo();

        return Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(BrandDark));

                page.Header().Element(c => ComposeHeader(c, data, logoBytes));
                page.Content().PaddingTop(18).Element(c => ComposeContent(c, data));
                page.Footer().PaddingTop(8).Element(ComposeFooter);
            });
        }).GeneratePdf();
    }

    private byte[]? TryLoadLogo()
    {
        var candidates = new[]
        {
            Path.Combine(env.ContentRootPath, "Assets", "logo.jpg"),
            Path.Combine(AppContext.BaseDirectory, "Assets", "logo.jpg"),
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
                logger.LogWarning(ex, "Unable to read invoice logo at {Path}", path);
            }
        }

        return null;
    }

    private static void ComposeHeader(IContainer container, InvoiceDocumentData data, byte[]? logoBytes)
    {
        container.Column(column =>
        {
            column.Item().Background(BrandBlue).Padding(18).Row(row =>
            {
                row.RelativeItem().Row(inner =>
                {
                    if (logoBytes is not null)
                    {
                        inner.ConstantItem(56).Height(56).Image(logoBytes).FitArea();
                        inner.ConstantItem(14);
                    }

                    inner.RelativeItem().Column(brand =>
                    {
                        brand.Item().Text("Al-Wakeel Al-Shamel").FontSize(18).Bold().FontColor(Colors.White);
                        brand.Item().Text("Order Management System").FontSize(10).FontColor(HeaderSubtext);
                        brand.Item().PaddingTop(4).Text("Riyadh, Saudi Arabia").FontSize(9).FontColor(HeaderSubtext);
                    });
                });

                row.ConstantItem(180).AlignRight().Column(right =>
                {
                    right.Item().AlignRight().Text("INVOICE").FontSize(24).Bold().FontColor(Colors.White);
                    right.Item().AlignRight().Text(data.OrderId).FontSize(11).SemiBold().FontColor(Colors.White);
                    right.Item().AlignRight().PaddingTop(6).Text(data.OrderDate.ToString("dd MMM yyyy, HH:mm 'UTC'"))
                        .FontSize(9).FontColor(HeaderSubtext);
                });
            });

            column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Border);
        });
    }

    private static void ComposeContent(IContainer container, InvoiceDocumentData data)
    {
        container.Column(column =>
        {
            column.Spacing(14);

            column.Item().Row(row =>
            {
                row.RelativeItem().Element(c => InfoCard(c, "Bill To", stack =>
                {
                    stack.Item().Text(data.CustomerName).FontSize(12).SemiBold();
                    stack.Item().Text(data.CustomerEmail).FontColor(Muted);
                    stack.Item().Text(data.CustomerPhone).FontColor(Muted);
                    stack.Item().PaddingTop(4).Text(data.CustomerAddress).FontColor(Muted);
                }));

                row.ConstantItem(16);

                row.RelativeItem().Element(c => InfoCard(c, "Order Details", stack =>
                {
                    DetailRow(stack, "Order Number", data.OrderId);
                    DetailRow(stack, "Order Date", data.OrderDate.ToString("dd MMM yyyy"));
                    DetailRow(stack, "Order Status", data.OrderStatus);
                    DetailRow(stack, "Payment Method", FormatPaymentMethod(data.PaymentMethod));
                    DetailRow(stack, "Payment Status", data.PaymentStatus ?? "—");
                    if (!string.IsNullOrWhiteSpace(data.TransactionReference))
                        DetailRow(stack, "Transaction Ref.", data.TransactionReference);
                }));
            });

            column.Item().Element(c => InfoCard(c, "Shipping", stack =>
            {
                DetailRow(stack, "Carrier", data.ShippingCarrier);
                DetailRow(stack, "Service", data.ShippingService);
                DetailRow(stack, "Shipping cost", data.ShippingCostLabel);
                DetailRow(stack, "Estimated delivery", data.ShippingEstimatedDelivery);
                DetailRow(stack, "Tracking number", data.ShippingTrackingNumber);
            }));

            column.Item().Element(c => InfoCard(c, "Line Items", stack =>
            {
                stack.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(28);
                        columns.RelativeColumn(4);
                        columns.ConstantColumn(52);
                        columns.ConstantColumn(72);
                        columns.ConstantColumn(78);
                    });

                    table.Header(header =>
                    {
                        static IContainer HeaderCell(IContainer c) =>
                            c.DefaultTextStyle(x => x.SemiBold().FontColor(Colors.White).FontSize(9))
                                .Background(BrandBlue)
                                .PaddingVertical(8)
                                .PaddingHorizontal(6);

                        header.Cell().Element(HeaderCell).Text("#");
                        header.Cell().Element(HeaderCell).Text("Product");
                        header.Cell().Element(HeaderCell).AlignCenter().Text("Qty");
                        header.Cell().Element(HeaderCell).AlignRight().Text("Unit Price");
                        header.Cell().Element(HeaderCell).AlignRight().Text("Subtotal");
                    });

                    var index = 1;
                    foreach (var item in data.Items)
                    {
                        var shaded = index % 2 == 0;
                        IContainer BodyCell(IContainer c) =>
                            c.Background(shaded ? SoftBg : Colors.White)
                                .BorderBottom(1).BorderColor(Border)
                                .PaddingVertical(8)
                                .PaddingHorizontal(6);

                        table.Cell().Element(BodyCell).Text(index.ToString()).FontColor(Muted);
                        table.Cell().Element(BodyCell).Column(col =>
                        {
                            col.Item().Text(item.Name).SemiBold();
                            col.Item().Text(item.ProductId).FontSize(8).FontColor(Muted);
                        });
                        table.Cell().Element(BodyCell).AlignCenter().Text(item.Quantity.ToString());
                        table.Cell().Element(BodyCell).AlignRight().Text($"${item.UnitPrice:F2}");
                        table.Cell().Element(BodyCell).AlignRight().Text($"${item.Subtotal:F2}").SemiBold();
                        index++;
                    }
                });
            }));

            column.Item().AlignRight().Width(240).Element(totalCard =>
            {
                totalCard.Border(1).BorderColor(Border).Background(SoftBg).Padding(12).Column(col =>
                {
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Subtotal").FontColor(Muted);
                        r.ConstantItem(90).AlignRight().Text($"${data.TotalPrice:F2}");
                    });
                    col.Item().PaddingTop(6).Row(r =>
                    {
                        r.RelativeItem().Text($"Shipping ({data.ShippingService})").FontColor(Muted);
                        r.ConstantItem(90).AlignRight().Text(data.ShippingCostLabel).FontColor(Success);
                    });
                    col.Item().PaddingTop(8).LineHorizontal(1).LineColor(Border);
                    col.Item().PaddingTop(8).Row(r =>
                    {
                        r.RelativeItem().Text("Total Paid").FontSize(12).Bold();
                        r.ConstantItem(90).AlignRight().Text($"${data.TotalPrice:F2}").FontSize(14).Bold().FontColor(BrandBlue);
                    });
                });
            });

            column.Item().PaddingTop(4).Text(
                    "This invoice confirms payment received for the order listed above. Please retain a copy for your records.")
                .FontSize(9).FontColor(Muted);
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().LineHorizontal(1).LineColor(Border);
            column.Item().PaddingTop(8).Row(row =>
            {
                row.RelativeItem().Text("Thank you for shopping with Al-Wakeel Al-Shamel.").FontSize(9).FontColor(Muted);
                row.RelativeItem().AlignRight().Text(text =>
                {
                    text.Span("Page ").FontSize(9).FontColor(Muted);
                    text.CurrentPageNumber().FontSize(9).FontColor(Muted);
                    text.Span(" of ").FontSize(9).FontColor(Muted);
                    text.TotalPages().FontSize(9).FontColor(Muted);
                });
            });
        });
    }

    private static void InfoCard(IContainer container, string title, Action<ColumnDescriptor> content)
    {
        container.Border(1).BorderColor(Border).Background(Colors.White).Padding(12).Column(column =>
        {
            column.Item().Text(title).FontSize(11).SemiBold().FontColor(BrandBlue);
            column.Item().PaddingTop(8).Column(content);
        });
    }

    private static void DetailRow(ColumnDescriptor column, string label, string value)
    {
        column.Item().PaddingBottom(4).Row(row =>
        {
            row.RelativeItem().Text(label).FontColor(Muted).FontSize(9);
            row.RelativeItem().AlignRight().Text(value).FontSize(9).SemiBold();
        });
    }

    private static string FormatPaymentMethod(string method) => method switch
    {
        "CreditCard" => "Credit Card",
        "OnlineBanking" => "Online Banking",
        "Cash" => "Cash",
        "Credit" => "Credit",
        _ => method
    };
}

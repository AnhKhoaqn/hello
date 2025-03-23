from django.http import JsonResponse
from django.shortcuts import render
from home.models import Bill, BillLine

def bill_data_json(request):
    # Truy vấn dữ liệu từ database, kết hợp tất cả thông tin
    bill_lines = BillLine.objects.select_related(
        'bill__customer__segment', 'product__category'
    ).values(
        "bill__time_created", "bill__bill_code",
        "bill__customer__customer_code",
        "bill__customer__segment__segment_code",
        "bill__customer__segment__segment_info",
        "product__category__category_code", "product__category__category_name",
        "product__product_code", "product__product_name",
        "quantity", "price_at_purchase"
    )

    # Chuyển đổi dữ liệu thành danh sách JSON
    data = [
        {
            "Thời gian tạo đơn": record["bill__time_created"].strftime("%Y-%m-%d %H:%M"),
            "Mã đơn hàng": record["bill__bill_code"],
            "Mã khách hàng": record["bill__customer__customer_code"],
            "Mã PKKH": record["bill__customer__segment__segment_code"],
            "Mô tả Phân Khúc Khách Hàng": record["bill__customer__segment__segment_info"],
            "Mã nhóm hàng": record["product__category__category_code"],
            "Tên nhóm hàng": record["product__category__category_name"],
            "Mã mặt hàng": record["product__product_code"],
            "Tên mặt hàng": record["product__product_name"],
            "SL": record["quantity"],
            "Thành tiền":  record["price_at_purchase"]
        }
        for record in bill_lines
    ]

    return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False})

def bill_visualization(request):
    return render(request, 'home/data_visualization.html')

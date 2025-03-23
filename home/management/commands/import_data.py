import os
import csv
from datetime import datetime
from django.core.management.base import BaseCommand
from home.models import Segment, Customer, Category, Product, Bill, BillLine

class Command(BaseCommand):
    help = "Import data from data_ggsheet.csv into the database"

    def handle(self, *args, **kwargs):
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(BASE_DIR, 'data_ggsheet.csv')

        with open(file_path, newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                segment, _ = Segment.objects.get_or_create(
                    segment_code=row.get('Mã PKKH', ''),
                    segment_info=row.get('Mô tả Phân Khúc Khách hàng', '')
                )

                customer, _ = Customer.objects.get_or_create(
                    customer_code=row.get('Mã khách hàng', ''),
                    segment=segment
                )

                category, _ = Category.objects.get_or_create(
                    category_code=row.get('Mã nhóm hàng', ''),
                    category_name=row.get('Tên nhóm hàng', '')
                )

                product, _ = Product.objects.get_or_create(
                    product_code=row.get('Mã mặt hàng', ''),
                    product_name=row.get('Tên mặt hàng', ''),
                    price=int(row.get('Đơn giá', 0)),  # Đảm bảo kiểu số nguyên
                    category=category
                )

                # Chuyển đổi thời gian từ chuỗi sang datetime
                time_created_str = row.get('Thời gian tạo đơn', '').strip()
                time_created = None
                if time_created_str:
                    try:
                        time_created = datetime.strptime(time_created_str, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f"⚠ Lỗi định dạng thời gian: {time_created_str}"))

                bill, _ = Bill.objects.get_or_create(
                    bill_code=row.get('Mã đơn hàng', ''),
                    customer=customer,
                    defaults={'time_created': time_created}  # Chỉ gán nếu bill mới
                )

                BillLine.objects.create(
                    bill=bill,
                    product=product,
                    quantity=int(row.get('SL', 0)),  # Đảm bảo kiểu số nguyên
                    price_at_purchase=int(row.get('Thành tiền', 0))
                )

        self.stdout.write(self.style.SUCCESS("✅ Data imported successfully!"))

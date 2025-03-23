from django.contrib import admin
from .models import Segment, Customer, Category, Product, Bill, BillLine

admin.site.register(Segment)
admin.site.register(Customer)
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Bill)
admin.site.register(BillLine)

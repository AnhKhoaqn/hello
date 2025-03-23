from django.urls import path
from .views import bill_visualization, bill_data_json  # Kiểm tra lại

urlpatterns = [
    path('visualization/', bill_visualization, name='bill_visualization'),
    path('data/', bill_data_json, name='bill_data_json'),
    
]

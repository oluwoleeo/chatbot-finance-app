import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import statsmodels.api as sm
# from io import BytesIO
# from flask import send_file

# Aggregate monthly spending
def get_monthly_spending(user_df):
    monthly = user_df.groupby('year_month')['amt'].sum().reset_index()
    monthly['month_index'] = np.arange(len(monthly))
    return monthly

class ChatbotLogic:
    def __init__(self, data_path):
        self.df = pd.read_csv(data_path)
        self.df['dob'] = pd.to_datetime(self.df['dob'], errors='coerce')
        self.df['trans_date_trans_time'] = pd.to_datetime(self.df['trans_date_trans_time'], errors='coerce')
        self.df['year_month'] = self.df['trans_date_trans_time'].dt.to_period('M')
        self.df['year_month'] = self.df['year_month'].dt.to_timestamp()

    def get_user_insights(self, first_name, last_name, age):
        try:
            age = int(age)
        except ValueError:
            return {"error": "Invalid age"}

        current_year = datetime.now().year
        df_filtered = self.df.copy()
        df_filtered['calculated_age'] = current_year - df_filtered['dob'].dt.year

        user_data = df_filtered[
            (df_filtered['first'].str.lower() == first_name.lower()) &
            (df_filtered['last'].str.lower() == last_name.lower()) &
            (df_filtered['calculated_age'] == age)
        ]

        if user_data.empty:
            return {"message": "No records found for the user."}

        total_spending = user_data['amt'].sum()
        category_spending = user_data.groupby('category')['amt'].sum().to_dict()
        most_frequent_category = user_data['category'].mode()[0] if not user_data['category'].mode().empty else "Unknown"
        avg_transaction = user_data['amt'].mean()

        return {
            "total_spending": round(total_spending, 2),
            "spending_by_category": {k: round(v, 2) for k, v in category_spending.items()},
            "most_frequent_category": most_frequent_category,
            "average_transaction_amount": round(avg_transaction, 2),
            "transaction_count": len(user_data)
        }

    def forecast(self, user_data):
        monthly = get_monthly_spending(user_data)

        # Linear Regression
        x = monthly[['month_index']]
        y = monthly['amt']
        lr = LinearRegression()
        lr.fit(x, y)
        monthly['linear_trend'] = lr.predict(x)

        ts_data = monthly['amt']

        model = sm.tsa.ARIMA(ts_data, order=(1, 1, 1))
        results = model.fit()
        forecast = results.get_forecast(steps=6)
        forecast_df = forecast.summary_frame()

        return {
            'linear_trend': monthly[['year_month', 'amt', 'linear_trend']].to_dict(orient='records'),
            'ts_data': ts_data,
            'forecast_df': forecast_df
        }

    def plot(self, first, last, age):
        try:
            age = int(age)
        except ValueError:
            return {"error": "Invalid age"}

        # Filter user data
        current_year = datetime.now().year
        df_filtered = self.df.copy()
        df_filtered['calculated_age'] = current_year - df_filtered['dob'].dt.year

        user_data = df_filtered[
            (df_filtered['first'].str.lower() == first.lower()) &
            (df_filtered['last'].str.lower() == last.lower()) &
            (df_filtered['calculated_age'] == age)
        ]

        if user_data.empty:
            return {'message': 'User not found'}

        models = self.forecast(user_data)

        forecast_df_user = models['forecast_df']

        plt.figure(figsize=(10, 5))
        plt.plot(models['ts_data'], label='Historical')
        plt.plot(forecast_df_user.index, forecast_df_user['mean'], label='Forecast')
        plt.fill_between(forecast_df_user.index, forecast_df_user['mean_ci_lower'], forecast_df_user['mean_ci_upper'],
                         color='gray', alpha=0.3)
        plt.title('ARIMA 6-month spending forecast for user')
        plt.xlabel('Month')
        plt.ylabel('Spending')
        plt.legend()

        # buf = BytesIO()
        # plt.savefig(buf, format='jpg')
        # buf.seek(0)
        filename = f'forecast{datetime.now().timestamp()}'.replace('.','')
        filename += f'.jpg'
        plt.savefig(f'static/{filename}')
        plt.close()
        # send_file(buf, mimetype='image/jpg', as_attachment=False, download_name='forecast.png')
        return {
            'filename': filename
        }
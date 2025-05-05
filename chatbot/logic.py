import pandas as pd;
from datetime import datetime

class ChatbotLogic:
    def __init__(self, data_path):
        self.df = pd.read_csv(data_path)
        self.df['dob'] = pd.to_datetime(self.df['dob'], errors='coerce')
        self.df['trans_date_trans_time'] = pd.to_datetime(self.df['trans_date_trans_time'], errors='coerce')

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
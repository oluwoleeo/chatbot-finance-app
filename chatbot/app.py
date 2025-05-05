from flask import Flask, request, jsonify
from flask_cors import CORS
from logic import ChatbotLogic

app = Flask(__name__)
CORS(app)

chatbot = ChatbotLogic("../credit_card_transactions.csv")


@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    age = data.get("age")
    if not all([first_name, last_name, age]):
        return jsonify({"error": "Missing fields"}), 400
    response = chatbot.get_user_insights(first_name, last_name, age)
    return jsonify(response)


if __name__ == '__main__':
    app.run()

from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from logic import ChatbotLogic

app = Flask(__name__, static_folder='static')
CORS(app)

chatbot = ChatbotLogic("../credit_card_transactions.csv")


@app.route('/')
def hello_world():  # put application's code here
    return 'Hello World!'


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    action = data.get("action")

    if action == 1:
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        age = data.get("age")

        if not all([first_name, last_name, age]):
            return jsonify({"error": "Missing fields"}), 400

        response = chatbot.get_user_insights(first_name, last_name, age)
    elif action == 2:
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        age = data.get("age")

        if not all([first_name, last_name, age]):
            return jsonify({"error": "Missing fields"}), 400

        plot = chatbot.plot(first_name, last_name, age)

        if 'filename' in plot:
            response = {
                'url': url_for('static', filename=plot['filename'])
            }
        else:
            response = plot
    else:
        return jsonify({"error": "Invalid action"}), 400

    return jsonify(response)


if __name__ == '__main__':
    app.run()

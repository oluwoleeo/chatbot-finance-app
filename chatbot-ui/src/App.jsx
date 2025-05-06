import { useState } from 'react'
import axios from 'axios';
import './App.css'

function App() {
  const firstMessage = { sender: 'bot', text: 'Please select an option:\n1. Get financial insights\n2. Predict future spending\n' }
  const [messages, setMessages] = useState([firstMessage]);

  const [input, setInput] = useState('');
  const [userData, setUserData] = useState({});
  const [step, setStep] = useState('menu');
  const [action, setAction] = useState(null);

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage = { sender: 'user', text: input };
    const updatedUserData = { ...userData };

    let newBotMessages = [];

    if (step === 'menu') {
      if (['1', '2', '3'].includes(input.trim())) {
        newBotMessages.push({ sender: 'bot', text: 'Great! Please provide your first name.' });
        setAction(parseInt(input.trim()));
        setStep('first');
      } else {
        newBotMessages.push({ sender: 'bot', text: 'Invalid choice. Please enter 1, 2, or 3.' });
      }
    } else if (step === 'first') {
      updatedUserData.first_name = input;
      newBotMessages.push({ sender: 'bot', text: 'Thanks! What is your last name?' });
      setStep('last');
    } else if (step === 'last') {
      updatedUserData.last_name = input;
      newBotMessages.push({ sender: 'bot', text: 'Great! How old are you?' });
      setStep('age');
    } else if (step === 'age') {
      updatedUserData.age = input;
      newBotMessages.push({ sender: 'bot', text: 'Thank you! Let me analyze your request...' });
      setStep('menu');

      try {
        const requestBody = { ...updatedUserData, action }
        const res = await axios.post('http://localhost:5000/chat', requestBody);

        const data = res.data;

        if (action === 1) {
          let categorySpending = '';
          
          const displayMap = {
            entertainment: 'Entertainment',
            food_dining: 'Food Dining',
            gas_transport: 'Gas Transport',
            grocery_net: 'Groceries',
            grocery_pos: 'Total Groceryies',
            health_fitness: 'Fitness',
            home: 'Home',
            kids_pets: 'Kids/Pets',
            misc_net: 'Miscellaneous',
            misc_pos: 'Total Miscellaneous',
            personal_care: 'Personal Care',
            shopping_net: 'Shopping',
            shopping_pos: 'Total Shopping',
            travel: 'Travel'
          }
          
          if (data.spending_by_category){
            for (let record of Object.entries(data.spending_by_category)){
              categorySpending += `${displayMap[record[0]]}: ${record[1]}\n`
            }
          }
          
          const messageFromRes = !data.message ? `Average Transaction Amount: ${data.average_transaction_amount}\n
          Most Frequent Category: ${displayMap[data.most_frequent_category]}\n
          Transaction Count: ${data.transaction_count}\n
          Total Spending: ${data.total_spending}\n
          Spending by category\n
          ${categorySpending}` : data.message;

          newBotMessages.push(
            { sender: 'bot', text: messageFromRes },
            firstMessage
          );
        }

        if (action === 2){
          if (data.url){
            newBotMessages.push(
              { sender: 'bot', text: "Here's your spending forecast based on historical data." },
              { sender: 'bot', image: `http://localhost:5000${data.url}` },
              firstMessage
            );
          } else{
            newBotMessages.push(
              { sender: 'bot', text: data.message },
              firstMessage
            );
          }
        }
      } catch (error) {
        if (error.response){
          newBotMessages.push(
            { sender: 'bot', text: error.response.data?.error },
            firstMessage
          );
        } else {
          newBotMessages.push(
            { sender: 'bot', text: 'Oops! Something went wrong. Try again.' },
            firstMessage
          );
        }
      }
    }

    setUserData(updatedUserData);
    setMessages(prev => [...prev, userMessage, ...newBotMessages]);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white p-4 rounded shadow-md">
        <div className="h-96 overflow-y-auto border-b mb-4 p-2 space-y-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`text-${msg.sender === 'bot' ? 'left' : 'right'}`}> 
              {msg.text && (
                <span className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'bot' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'}`}>{msg.text}</span>
              )
              }
              {
                msg.image && (
                  <div className="mt-2"><img src={msg.image} alt="Forecast" className="max-w-full rounded-lg shadow" /></div>
                  )
              }
                </div>
              ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
        </div>
      </div>
    </div>
  );
}

export default App

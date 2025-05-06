import { useState } from 'react'
import axios from 'axios';
import './App.css'

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! Please provide your first name.' },
  ]);

  const [input, setInput] = useState('');
  const [userData, setUserData] = useState({});
  const [step, setStep] = useState('first');

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage = { sender: 'user', text: input };
    const updatedUserData = { ...userData };
  
    let newBotMessages = [];
  
    if (step === 'first') {
      updatedUserData.first_name = input;
      newBotMessages.push({ sender: 'bot', text: 'Thanks! What is your last name?' });
      setStep('last');
    } else if (step === 'last') {
      updatedUserData.last_name = input;
      newBotMessages.push({ sender: 'bot', text: 'Great! How old are you?' });
      setStep('age');
    } else if (step === 'age') {
      updatedUserData.age = input;
      newBotMessages.push({ sender: 'bot', text: 'Thank you! Let me analyze your spending...' });
      setStep('done');
  
      try {
        const res = await axios.post('http://localhost:5000/chat', updatedUserData);
        const data = res.data;
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
        
        const messageFromRes = !data.message ? `<p>Average Transaction Amount: ${data.average_transaction_amount}</p>\n
        <p>Most Frequent Category: ${displayMap[data.most_frequent_category]}</p>\n
        Transaction Count: ${data.transaction_count}\n
        Total Spending: ${data.total_spending}\n
        Spending by category\n
        ${categorySpending}
        ` : data.message;
        newBotMessages.push({ sender: 'bot', text: messageFromRes });
      } catch (err) {
        console.error(err);
        newBotMessages.push({ sender: 'bot', text: 'Oops! Something went wrong. Try again.' });
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
              <span className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'bot' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'}`}>{msg.text}</span>
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

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const socket = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');

const CRYPTOS = ['btcusdt', 'ethusdt', 'bnbusdt', 'xrpusdt', 'adausdt'];

function App() {
  const [prices, setPrices] = useState({});
  const [history, setHistory] = useState({});
  const [selected, setSelected] = useState('btcusdt');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(false);

  const toggleFavorite = (coin) => {
    const updated = favorites.includes(coin)
      ? favorites.filter((c) => c !== coin)
      : [...favorites, coin];
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const fetch24hHistory = async (symbol) => {
    try {
      const idMap = {
        btcusdt: 'bitcoin',
        ethusdt: 'ethereum',
        bnbusdt: 'binancecoin',
        xrpusdt: 'ripple',
        adausdt: 'cardano',
      };
      const id = idMap[symbol];
      const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1`;
      const res = await axios.get(url);
      const prices = res.data.prices.map((p) => p[1]);
      setHistory((prev) => ({ ...prev, [symbol]: prices.slice(-50) }));
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const updated = {};
      data.forEach((coin) => {
        const symbol = coin.s.toLowerCase();
        if (CRYPTOS.includes(symbol)) {
          updated[symbol] = parseFloat(coin.c);
        }
      });
      setPrices((prev) => ({ ...prev, ...updated }));
    };
  }, []);

  useEffect(() => {
    fetch24hHistory(selected);
    const interval = setInterval(() => {
      setHistory((prev) => {
        const prevData = prev[selected] || [];
        const nextData = [...prevData, prices[selected] || 0].slice(-50);
        return { ...prev, [selected]: nextData };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [selected, prices]);

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </button>

      <h1>CryptoPulse</h1>

      <button
        onClick={() => {
          const data = history[selected] || [];
          const csv = data.map((v, i) => `${i + 1},${v}`).join('\n');
          const blob = new Blob([`Index,Price\n${csv}`], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selected}-price-history.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
      >
        Download CSV
      </button>

      <div className="price-list">
        {CRYPTOS.map((coin) => (
          <div
            key={coin}
            className={`card ${selected === coin ? 'selected' : ''}`}
            onClick={() => setSelected(coin)}
          >
            <h2>
              {coin.toUpperCase()}{' '}
              <span
                style={{
                  cursor: 'pointer',
                  color: favorites.includes(coin) ? 'gold' : '#ccc',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(coin);
                }}
              >
                ★
              </span>
            </h2>
            <p>${prices[coin] || '...'}</p>
          </div>
        ))}
      </div>

      <div className="chart">
        <Line
          data={{
            labels: Array.from(
              { length: history[selected]?.length || 0 },
              (_, i) => i
            ),
            datasets: [
              {
                label: `${selected.toUpperCase()} Price`,
                data: history[selected] || [],
                borderColor: 'blue',
                fill: false,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}

export default App;

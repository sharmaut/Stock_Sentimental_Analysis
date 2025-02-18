import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { Container, TextField, Button, Typography, CircularProgress } from '@mui/material';

function EnhancedDashboard() {
  const [symbol, setSymbol] = useState('');
  const [chartData, setChartData] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    setChartData(null);
    setRecommendation('');

      // try {
  //   const response = await fetch('http://127.0.0.1:8001/analyze', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ symbol }),
  //   });
  //   if (!response.ok) {
  //     const errData = await response.json();
  //     throw new Error(errData.detail || 'Error analyzing stock.');
  //   }
  //   const data = await response.json();
  //   console.log('Response data:', data);

  //   // TODO: process data to build chartData, setChartData, etc.
  // } catch (err) {
  //   setError(err.message);
  // }

    const upperSymbol = symbol.toUpperCase().trim();
    try {
      // Attempt to fetch the tweets and news JSON files from public folder
      const tweetsResponse = await fetch(`/tweets_analysis.json`);
      const newsResponse = await fetch(`/news_analysis.json`);

      if (!tweetsResponse.ok)
        throw new Error(`Tweet sentiment data for ${upperSymbol} not found.`);
      if (!newsResponse.ok)
        throw new Error(`News sentiment data for ${upperSymbol} not found.`);

      // Parse JSON
      const tweetsObj = await tweetsResponse.json();
      const newsObj = await newsResponse.json();

      // Convert each JSON into arrays for easier .reduce() usage
      let tweetsData;
      if (Array.isArray(tweetsObj)) {
        // If the JSON is a direct array
        tweetsData = tweetsObj;
      } else {
        // If the JSON is a dict keyed by symbol (e.g. { "AAPL": [...] })
        tweetsData = tweetsObj[upperSymbol] || [];
      }

      let newsData;
      if (Array.isArray(newsObj)) {
        newsData = newsObj;
      } else {
        newsData = newsObj[upperSymbol] || [];
      }

      // Compute average TextBlob polarity for tweets
      const tweetPolaritySum = tweetsData.reduce(
        (sum, t) => sum + (t.textblob?.polarity || 0),
        0
      );
      const avgTweetPolarity = tweetsData.length
        ? tweetPolaritySum / tweetsData.length
        : 0;

      // Compute average TextBlob polarity for news
      const newsPolaritySum = newsData.reduce(
        (sum, n) => sum + (n.textblob?.polarity || 0),
        0
      );
      const avgNewsPolarity = newsData.length
        ? newsPolaritySum / newsData.length
        : 0;

      // Simple combined average
      const combinedAvg = (avgTweetPolarity + avgNewsPolarity) / 2;

      // Instead of returning, we store the logic in a variable
      let rec;
      if (combinedAvg > 0.3) rec = 'Strong Buy';
      else if (combinedAvg > 0) rec = 'Good Buy';
      else if (combinedAvg > -0.3) rec = 'Neutral';
      else rec = 'Not a Good Buy';

      // Build bar chart data
      setChartData({
        labels: [upperSymbol],
        datasets: [
          {
            label: 'Tweet Sentiment (TextBlob)',
            data: [avgTweetPolarity],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          },
          {
            label: 'News Sentiment (TextBlob)',
            data: [avgNewsPolarity],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          },
        ],
      });

      setRecommendation(rec);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Stock Sentiment Dashboard
      </Typography>
      <TextField
        fullWidth
        label="Enter Your Preferred Stock Symbol (e.g., AAPL)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleAnalyze}
        disabled={loading}
        style={{ marginTop: '1rem' }}
      >
        ANALYZE
      </Button>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <CircularProgress />
        </div>
      )}
      {error && (
        <Typography variant="body1" color="error" style={{ marginTop: '1rem' }}>
          {error}
        </Typography>
      )}
      {chartData && (
        <div style={{ marginTop: '2rem' }}>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  min: -1,
                  max: 1,
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`,
                  },
                },
                legend: {
                  position: 'top',
                },
              },
            }}
          />
          <Typography variant="h6" align="center" style={{ marginTop: '1rem' }}>
            Recommendation: {recommendation}
          </Typography>
        </div>
      )}
    </Container>
  );
}

export default EnhancedDashboard;

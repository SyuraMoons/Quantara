"""
Example: Using the NexYpher Pretrained XGBoost Predictor
=========================================================

This shows how to use the predictor in your other project.
Replace the sample data below with your actual price/volume data.
"""

from predictor import NexYpherPredictor


def main():
    # 1. Initialize (auto-loads models from ./models/ folder)
    predictor = NexYpherPredictor()

    # 2. Print model info
    print("Model Info:", predictor.info())

    # 3. Prepare your data
    #    - closes: list of daily close prices (oldest -> newest, at least 50 points)
    #    - volumes: list of daily volumes (same length)
    #
    #    Example: fetch from your data source
    #    closes = get_daily_closes("bitcoin", days=200)
    #    volumes = get_daily_volumes("bitcoin", days=200)

    # Sample data for demo (replace with real data!)
    import random
    random.seed(42)
    base_price = 50000
    closes = []
    volumes = []
    for i in range(200):
        base_price *= (1 + random.uniform(-0.03, 0.03))
        closes.append(base_price)
        volumes.append(random.uniform(1e9, 5e9))

    # 4. Make prediction
    result = predictor.predict(
        closes=closes,
        volumes=volumes,
        # Optional - provide if you have them for better accuracy:
        # price_change_24h=2.5,       # % change last 24h
        # price_change_7d=-1.2,       # % change last 7d
        # price_change_30d=15.0,      # % change last 30d
        # volume_mcap_ratio=0.05,     # 24h volume / market cap
        # ath_change_pct=-30.0,       # % below all-time high
        # fear_greed_value=65.0,      # Fear & Greed Index (0-100)
    )

    # 5. Use the results
    print(f"\n{'='*50}")
    print(f"Verdict:       {result['verdict']}")
    print(f"Direction:     {result['direction']}")
    print(f"Prob Up 24h:   {result['prob_up_24h']}%")
    print(f"Prob Up 7d:    {result['prob_up_7d']}%")
    print(f"Confidence:    {result['confidence']}/10")
    print(f"Direction Probs: {result['direction_probs']}")
    print(f"Model Version: {result['model_version']}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()

from datetime import datetime, timedelta
import random

class DynamicPricingEngine:
    
    @staticmethod
    def calculate_price(base_price: float, total_seats: int, available_seats: int, departure_time: datetime) -> float:
        """
        Calculate dynamic price based on:
        1. Seat availability (demand)
        2. Time to departure
        3. Random demand fluctuation
        """
        
        occupancy_rate = (total_seats - available_seats) / total_seats if total_seats > 0 else 0
        
        if occupancy_rate < 0.3:
            demand_multiplier = 0.85
        elif occupancy_rate < 0.5:
            demand_multiplier = 1.0
        elif occupancy_rate < 0.7:
            demand_multiplier = 1.15
        elif occupancy_rate < 0.9:
            demand_multiplier = 1.35
        else:
            demand_multiplier = 1.65
        
        time_to_departure = (departure_time - datetime.now()).total_seconds() / 3600
        
        if time_to_departure < 24:
            time_multiplier = 1.5
        elif time_to_departure < 48:
            time_multiplier = 1.3
        elif time_to_departure < 168:
            time_multiplier = 1.1
        elif time_to_departure < 720:
            time_multiplier = 1.0
        else:
            time_multiplier = 0.9
        
        random_factor = random.uniform(0.95, 1.05)
        
        final_price = base_price * demand_multiplier * time_multiplier * random_factor
        
        return round(final_price, 2)
    
    @staticmethod
    def get_price_trend(base_price: float, total_seats: int, available_seats: int) -> str:
        """
        Returns price trend indicator: 'low', 'moderate', or 'high'
        """
        occupancy_rate = (total_seats - available_seats) / total_seats if total_seats > 0 else 0
        
        if occupancy_rate < 0.5:
            return "low"
        elif occupancy_rate < 0.8:
            return "moderate"
        else:
            return "high"

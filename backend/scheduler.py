from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app import calculate_daily_referral_commissions, calculate_daily_roi_earnings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('investment_scheduler')

def start_scheduler():
    """Initialize and start the APScheduler for daily tasks"""
    try:
        scheduler = BackgroundScheduler()
        
        # Schedule the daily commission calculation to run at midnight (00:00) every day
        scheduler.add_job(
            calculate_daily_referral_commissions,
            trigger=CronTrigger(hour=12, minute=38),
            id='calculate_daily_commissions',
            name='Calculate daily referral commissions',
            replace_existing=True
        )
        
        # Schedule the daily ROI calculation to run at midnight (00:00) on weekdays only
        scheduler.add_job(
            calculate_daily_roi_earnings,
            trigger=CronTrigger(hour=12, minute=38, day_of_week='mon-fri'),
            id='calculate_daily_roi',
            name='Calculate daily ROI earnings',
            replace_existing=True
        )
        
        # Start the scheduler
        scheduler.start()
        logger.info("Scheduler started successfully with ROI and commission jobs")
        return scheduler
    except Exception as e:
        logger.error(f"Error starting scheduler: {str(e)}")
        raise

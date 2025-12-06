from prometheus_client import Counter, Histogram, Gauge

class MetricsService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MetricsService, cls).__new__(cls)
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        # Polling Metrics
        self.tags_read_total = Counter(
            "scada_tags_read_total", 
            "Total number of tags read from PLCs",
            ["connection"]
        )
        self.polling_duration = Histogram(
            "scada_polling_duration_seconds", 
            "Time spent polling PLCs",
            ["connection"]
        )

        # Logic Engine Metrics
        self.rules_evaluated_total = Counter(
            "scada_rules_evaluated_total", 
            "Total number of logic rules evaluated"
        )
        self.active_alarms = Gauge(
            "scada_active_alarms", 
            "Current number of active alarms",
            ["severity"]
        )

        # Integration Metrics
        self.external_sync_errors = Counter(
            "scada_external_sync_errors", 
            "Total number of external synchronization errors",
            ["provider"]
        )

    @classmethod
    def get(cls):
        if cls._instance is None:
            cls()
        return cls._instance

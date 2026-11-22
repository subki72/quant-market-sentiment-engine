.PHONY: install test lint run docker-build clean

install:
	pip install -r requirements-dev.txt

test:
	pytest -v --cov=src --cov-report=term-missing

lint:
	flake8 src tests scripts --max-line-length=120

run:
	uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload

docker-build:
	docker build -t quant-market-sentiment-engine:latest .

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	rm -rf .pytest_cache .coverage htmlcov

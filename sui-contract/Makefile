# Jastron Pass Sui Contract Makefile

# Variables
PACKAGE_NAME = jastron-pass
GAS_BUDGET = 200000000
NETWORK_TESTNET = testnet
NETWORK_MAINNET = mainnet
NETWORK_DEVNET = devnet

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Build commands
.PHONY: build
build: ## Build the Move package
	sui move build

.PHONY: build-test
build-test: ## Build the Move package for testing
	sui move build --test

# Test commands
.PHONY: test
test: ## Run all tests
	sui move test

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	sui move test --verbose

# Publish commands
.PHONY: publish-devnet
publish-devnet: ## Publish to devnet
	sui client switch --env devnet && sui client publish --gas-budget $(GAS_BUDGET)

.PHONY: publish-testnet
publish-testnet: ## Publish to testnet
	sui client switch --env testnet && sui client publish --gas-budget $(GAS_BUDGET)

.PHONY: publish-mainnet
publish-mainnet: ## Publish to mainnet
	sui client switch --env mainnet && sui client publish --gas-budget $(GAS_BUDGET)

.PHONY: publish-json
publish-json: ## Publish with JSON output
	sui client publish --gas-budget $(GAS_BUDGET) --json

# Client commands
.PHONY: active-address
active-address: ## Show active address
	sui client active-address

.PHONY: switch-address
switch-address: ## Switch active address (usage: make switch-address ADDRESS=0x...)
	@if [ -z "$(ADDRESS)" ]; then \
		echo "Error: ADDRESS parameter is required"; \
		echo "Usage: make switch-address ADDRESS=0x..."; \
		exit 1; \
	fi
	sui client switch --address $(ADDRESS)

.PHONY: balance
balance: ## Show account balance
	sui client balance

.PHONY: addresses
addresses: ## List all addresses
	sui client addresses

.PHONY: env
env: ## Show current environment
	sui client env

# Clean commands
.PHONY: clean
clean: ## Clean build artifacts
	rm -rf build/

.PHONY: clean-all
clean-all: clean ## Clean all artifacts including dependencies
	rm -rf build/ .sui/

# Development commands
.PHONY: dev
dev: build test ## Build and test the package

.PHONY: deploy-testnet
deploy-testnet: build publish-testnet ## Build and deploy to testnet

.PHONY: deploy-mainnet
deploy-mainnet: build publish-mainnet ## Build and deploy to mainnet

.PHONY: deploy-devnet
deploy-devnet: build publish-devnet ## Build and deploy to devnet

# Package info
.PHONY: info
info: ## Show package information
	@echo "Package: $(PACKAGE_NAME)"
	@echo "Gas Budget: $(GAS_BUDGET)"
	@echo "Available Networks: $(NETWORK_DEVNET), $(NETWORK_TESTNET), $(NETWORK_MAINNET)"

# Quick start
.PHONY: quick-start
quick-start: build test publish-testnet ## Quick start: build, test, and deploy to testnet
	@echo "Quick start completed! Package deployed to testnet."

# Full deployment pipeline
.PHONY: deploy-full
deploy-full: clean build test publish-testnet ## Full deployment pipeline
	@echo "Full deployment pipeline completed!"
	@echo "Next steps:"
	@echo "1. Test your package on testnet"
	@echo "2. Run 'make deploy-mainnet' to deploy to mainnet"

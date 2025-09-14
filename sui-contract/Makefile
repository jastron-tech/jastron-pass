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

.PHONY: help-deploy
help-deploy: ## Show deployment and parsing help
	@echo "🚀 Deployment and Parsing Commands:"
	@echo ""
	@echo "📦 Basic Deployment:"
	@echo "  make deploy-testnet              # Deploy to testnet"
	@echo "  make deploy-devnet               # Deploy to devnet"
	@echo "  make deploy-mainnet              # Deploy to mainnet"
	@echo ""
	@echo "📋 Enhanced Deployment with Parsing:"
	@echo "  make deploy-testnet-parse        # Deploy to testnet with object parsing"
	@echo "  make deploy-devnet-parse         # Deploy to devnet with object parsing"
	@echo "  make deploy-mainnet-parse        # Deploy to mainnet with object parsing"
	@echo ""
	@echo "🔄 Upgrade Commands:"
	@echo "  make upgrade-testnet PACKAGE_ID=0x...     # Upgrade on testnet"
	@echo "  make upgrade-testnet-parse PACKAGE_ID=0x... # Upgrade with parsing"
	@echo ""
	@echo "🔍 Object Extraction:"
	@echo "  make extract-all-objects FILE=path/to/file    # Extract all important objects"
	@echo "  make extract-object-ids FILE=path/to/file     # Extract all object IDs"
	@echo "  make extract-specific-objects FILE=path/to/file TYPE=ObjectType"
	@echo ""
	@echo "📊 Deployment Management:"
	@echo "  make list-deployments            # List all deployment files"
	@echo "  make latest-deployment           # Show latest deployment files"
	@echo "  make parse-latest NETWORK=testnet # Parse latest deployment"
	@echo "  make get-package-id NETWORK=testnet # Get package ID from latest deployment"
	@echo ""
	@echo "💡 Examples:"
	@echo "  make deploy-testnet-parse        # Deploy and parse objects"
	@echo "  make extract-all-objects FILE=deployment/testnet/20250914-v6.txt"
	@echo "  make find-object-by-type TYPE=UpgradeCap NETWORK=testnet"
	@echo "  make upgrade-testnet-parse PACKAGE_ID=0x281f8503d34b52616e5e8077ff2a44f244772b467dbe1ebfec6cbef19ff63b72"

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

# Enhanced publish commands with object parsing
.PHONY: publish-devnet-parse
publish-devnet-parse: ## Publish to devnet and parse object IDs
	@echo "🚀 Publishing to devnet..."
	sui client switch --env devnet
	@echo "📦 Publishing package..."
	@mkdir -p deployment/devnet
	sui client publish --gas-budget $(GAS_BUDGET) --json > deployment/devnet/$$(date +%Y%m%d)-v$$(ls deployment/devnet/ | grep -c "$$(date +%Y%m%d)") 2>/dev/null || sui client publish --gas-budget $(GAS_BUDGET) --json > deployment/devnet/$$(date +%Y%m%d)-v1
	@echo "📋 Parsing deployment results..."
	@make parse-deployment-result FILE=deployment/devnet/$$(ls deployment/devnet/ | tail -1)

.PHONY: publish-testnet-parse
publish-testnet-parse: ## Publish to testnet and parse object IDs
	@echo "🚀 Publishing to testnet..."
	sui client switch --env testnet
	@echo "📦 Publishing package..."
	@mkdir -p deployment/testnet
	sui client publish --gas-budget $(GAS_BUDGET) --json > deployment/testnet/$$(date +%Y%m%d)-v$$(ls deployment/testnet/ | grep -c "$$(date +%Y%m%d)") 2>/dev/null || sui client publish --gas-budget $(GAS_BUDGET) --json > deployment/testnet/$$(date +%Y%m%d)-v1
	@echo "📋 Parsing deployment results..."
	@make parse-deployment-result FILE=deployment/testnet/$$(ls deployment/testnet/ | tail -1)

.PHONY: publish-mainnet-parse
publish-mainnet-parse: ## Publish to mainnet and parse object IDs
	@echo "🚀 Publishing to mainnet..."
	sui client switch --env mainnet
	@echo "📦 Publishing package..."
	@mkdir -p deployment/mainnet
	sui client publish --gas-budget $(GAS_BUDGET) --json > deployment/mainnet/$$(date +%Y%m%d)-v$$(ls deployment/mainnet/ | grep -c "$$(date +%Y%m%d)") 2>/dev/null || sui client publish --gas-budget $(GAS_BUDGET) --json > deployment/mainnet/$$(date +%Y%m%d)-v1
	@echo "📋 Parsing deployment results..."
	@make parse-deployment-result FILE=deployment/mainnet/$$(ls deployment/mainnet/ | tail -1)

# Upgrade commands
.PHONY: upgrade-devnet
upgrade-devnet: ## Upgrade package on devnet (usage: make upgrade-devnet PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make upgrade-devnet PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	sui client switch --env devnet && sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID)

.PHONY: upgrade-testnet
upgrade-testnet: ## Upgrade package on testnet (usage: make upgrade-testnet PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make upgrade-testnet PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	sui client switch --env testnet && sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID)

.PHONY: upgrade-mainnet
upgrade-mainnet: ## Upgrade package on mainnet (usage: make upgrade-mainnet PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make upgrade-mainnet PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	sui client switch --env mainnet && sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID)

.PHONY: upgrade-json
upgrade-json: ## Upgrade with JSON output (usage: make upgrade-json PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make upgrade-json PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID) --json

# Enhanced upgrade commands with object parsing
.PHONY: upgrade-devnet-parse
upgrade-devnet-parse: ## Upgrade package on devnet and parse object IDs (usage: make upgrade-devnet-parse PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make upgrade-devnet-parse PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	@echo "🔄 Upgrading package on devnet..."
	sui client switch --env devnet
	@echo "📦 Upgrading package..."
	sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID) --json > deployment/devnet/$$(date +%Y%m%d)-upgrade-v$$(ls deployment/devnet/ | grep -c "$$(date +%Y%m%d)-upgrade") 2>/dev/null || sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID) --json > deployment/devnet/$$(date +%Y%m%d)-upgrade-v1
	@echo "📋 Parsing upgrade results..."
	@make parse-upgrade-result FILE=deployment/devnet/$$(ls deployment/devnet/ | grep upgrade | tail -1)

.PHONY: upgrade-testnet-parse
upgrade-testnet-parse: ## Upgrade package on testnet and parse object IDs (usage: make upgrade-testnet-parse PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make upgrade-testnet-parse PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	@echo "🔄 Upgrading package on testnet..."
	sui client switch --env testnet
	@echo "📦 Upgrading package..."
	sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID) --json > deployment/testnet/$$(date +%Y%m%d)-upgrade-v$$(ls deployment/testnet/ | grep -c "$$(date +%Y%m%d)-upgrade") 2>/dev/null || sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID) --json > deployment/testnet/$$(date +%Y%m%d)-upgrade-v1
	@echo "📋 Parsing upgrade results..."
	@make parse-upgrade-result FILE=deployment/testnet/$$(ls deployment/testnet/ | grep upgrade | tail -1)

.PHONY: upgrade-mainnet-parse
upgrade-mainnet-parse: ## Upgrade package on mainnet and parse object IDs (usage: make upgrade-mainnet-parse PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make upgrade-mainnet-parse PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	@echo "🔄 Upgrading package on mainnet..."
	sui client switch --env mainnet
	@echo "📦 Upgrading package..."
	sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID) --json > deployment/mainnet/$$(date +%Y%m%d)-upgrade-v$$(ls deployment/mainnet/ | grep -c "$$(date +%Y%m%d)-upgrade") 2>/dev/null || sui client upgrade --gas-budget $(GAS_BUDGET) --upgrade-capability $(PACKAGE_ID) --json > deployment/mainnet/$$(date +%Y%m%d)-upgrade-v1
	@echo "📋 Parsing upgrade results..."
	@make parse-upgrade-result FILE=deployment/mainnet/$$(ls deployment/mainnet/ | grep upgrade | tail -1)

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

# Parsing commands
.PHONY: parse-deployment-result
parse-deployment-result: ## Parse deployment result and extract object IDs (usage: make parse-deployment-result FILE=path/to/file)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required"; \
		echo "Usage: make parse-deployment-result FILE=path/to/file"; \
		exit 1; \
	fi
	@echo "📋 Parsing deployment result from $(FILE)..."
	@echo ""
	@# Check if file is JSON format
	@if jq empty $(FILE) 2>/dev/null; then \
		echo "🎯 Package Information:"; \
		jq -r '.objectChanges[] | select(.type == "published") | "📦 Package ID: \(.packageId)"' $(FILE) 2>/dev/null || echo "❌ No package ID found"; \
		echo ""; \
		echo "🔧 Created Objects:"; \
		jq -r '.objectChanges[] | select(.type == "created") | "🆕 \(.objectType // "Unknown"): \(.objectId)"' $(FILE) 2>/dev/null || echo "❌ No created objects found"; \
		echo ""; \
		echo "🔄 Mutated Objects:"; \
		jq -r '.objectChanges[] | select(.type == "mutated") | "🔄 \(.objectType // "Unknown"): \(.objectId)"' $(FILE) 2>/dev/null || echo "❌ No mutated objects found"; \
		echo ""; \
		echo "📊 Transaction Details:"; \
		jq -r '.digest as $digest | "🔗 Transaction Digest: \($digest)"' $(FILE) 2>/dev/null || echo "❌ No transaction digest found"; \
		jq -r '.effects.gasUsed.computationCost as $computation | "⛽ Computation Cost: \($computation)"' $(FILE) 2>/dev/null || echo "❌ No computation cost found"; \
		jq -r '.effects.gasUsed.storageCost as $storage | "💾 Storage Cost: \($storage)"' $(FILE) 2>/dev/null || echo "❌ No storage cost found"; \
		jq -r '.effects.gasUsed.storageRebate as $rebate | "💰 Storage Rebate: \($rebate)"' $(FILE) 2>/dev/null || echo "❌ No storage rebate found"; \
	else \
		echo "📄 Parsing human-readable format..."; \
		echo ""; \
		echo "🎯 Package Information:"; \
		grep -E "Package ID|Published Objects" $(FILE) | head -5 || echo "❌ No package information found"; \
		echo ""; \
		echo "🔧 Created Objects:"; \
		grep -E "Created Objects|Object ID:" $(FILE) | head -10 || echo "❌ No created objects found"; \
		echo ""; \
		echo "🔄 Mutated Objects:"; \
		grep -E "Mutated Objects|Object ID:" $(FILE) | head -10 || echo "❌ No mutated objects found"; \
		echo ""; \
		echo "📊 Transaction Details:"; \
		grep -E "Transaction Digest|Gas Used|Computation Cost|Storage Cost" $(FILE) | head -5 || echo "❌ No transaction details found"; \
	fi
	@echo ""
	@echo "📝 Summary saved to $(FILE)"

.PHONY: parse-upgrade-result
parse-upgrade-result: ## Parse upgrade result and extract object IDs (usage: make parse-upgrade-result FILE=path/to/file)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required"; \
		echo "Usage: make parse-upgrade-result FILE=path/to/file"; \
		exit 1; \
	fi
	@echo "📋 Parsing upgrade result from $(FILE)..."
	@echo ""
	@echo "🎯 Package Information:"
	@jq -r '.objectChanges[] | select(.type == "published") | "📦 New Package ID: \(.packageId)"' $(FILE) 2>/dev/null || echo "❌ No new package ID found"
	@echo ""
	@echo "🔧 Created Objects:"
	@jq -r '.objectChanges[] | select(.type == "created") | "🆕 \(.objectType // "Unknown"): \(.objectId)"' $(FILE) 2>/dev/null || echo "❌ No created objects found"
	@echo ""
	@echo "🔄 Mutated Objects:"
	@jq -r '.objectChanges[] | select(.type == "mutated") | "🔄 \(.objectType // "Unknown"): \(.objectId)"' $(FILE) 2>/dev/null || echo "❌ No mutated objects found"
	@echo ""
	@echo "📊 Transaction Details:"
	@jq -r '.digest as $digest | "🔗 Transaction Digest: \($digest)"' $(FILE) 2>/dev/null || echo "❌ No transaction digest found"
	@jq -r '.effects.gasUsed.computationCost as $computation | "⛽ Computation Cost: \($computation)"' $(FILE) 2>/dev/null || echo "❌ No computation cost found"
	@jq -r '.effects.gasUsed.storageCost as $storage | "💾 Storage Cost: \($storage)"' $(FILE) 2>/dev/null || echo "❌ No storage cost found"
	@jq -r '.effects.gasUsed.storageRebate as $rebate | "💰 Storage Rebate: \($rebate)"' $(FILE) 2>/dev/null || echo "❌ No storage rebate found"
	@echo ""
	@echo "📝 Summary saved to $(FILE)"

.PHONY: extract-object-ids
extract-object-ids: ## Extract all object IDs from deployment file (usage: make extract-object-ids FILE=path/to/file)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required"; \
		echo "Usage: make extract-object-ids FILE=path/to/file"; \
		exit 1; \
	fi
	@echo "🔍 Extracting object IDs from $(FILE)..."
	@echo ""
	@# Check if file is JSON format
	@if jq empty $(FILE) 2>/dev/null; then \
		echo "📦 Package ID:"; \
		jq -r '.objectChanges[] | select(.type == "published") | .packageId' $(FILE) 2>/dev/null || echo "❌ No package ID found"; \
		echo ""; \
		echo "🆕 Created Object IDs:"; \
		jq -r '.objectChanges[] | select(.type == "created") | .objectId' $(FILE) 2>/dev/null || echo "❌ No created objects found"; \
		echo ""; \
		echo "🔄 Mutated Object IDs:"; \
		jq -r '.objectChanges[] | select(.type == "mutated") | .objectId' $(FILE) 2>/dev/null || echo "❌ No mutated objects found"; \
	else \
		echo "📦 Package ID:"; \
		grep -oE "Package ID: 0x[a-fA-F0-9]+" $(FILE) | head -1 || echo "❌ No package ID found"; \
		echo ""; \
		echo "🆕 Created Object IDs:"; \
		grep -oE "Object ID: 0x[a-fA-F0-9]+" $(FILE) | grep -A5 -B5 "Created Objects" | head -10 || echo "❌ No created objects found"; \
		echo ""; \
		echo "🔄 Mutated Object IDs:"; \
		grep -oE "Object ID: 0x[a-fA-F0-9]+" $(FILE) | grep -A5 -B5 "Mutated Objects" | head -10 || echo "❌ No mutated objects found"; \
	fi

.PHONY: extract-specific-objects
extract-specific-objects: ## Extract specific object types (usage: make extract-specific-objects FILE=path/to/file TYPE=ObjectType)
	@if [ -z "$(FILE)" ] || [ -z "$(TYPE)" ]; then \
		echo "Error: FILE and TYPE parameters are required"; \
		echo "Usage: make extract-specific-objects FILE=path/to/file TYPE=ObjectType"; \
		echo "Example: make extract-specific-objects FILE=deployment/testnet/20250914-v1 TYPE=UpgradeCap"; \
		exit 1; \
	fi
	@echo "🔍 Extracting $(TYPE) objects from $(FILE)..."
	@# Check if file is JSON format
	@if jq empty $(FILE) 2>/dev/null; then \
		jq -r --arg type "$(TYPE)" '.objectChanges[] | select(.type == "created" and (.objectType | contains($type))) | "\(.objectType): \(.objectId)"' $(FILE) 2>/dev/null || echo "❌ No $(TYPE) objects found"; \
	else \
		grep -i "$(TYPE)" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -10 || echo "❌ No $(TYPE) objects found"; \
	fi

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

# Enhanced deployment commands with parsing
.PHONY: deploy-testnet-parse
deploy-testnet-parse: build publish-testnet-parse ## Build and deploy to testnet with object parsing

.PHONY: deploy-mainnet-parse
deploy-mainnet-parse: build publish-mainnet-parse ## Build and deploy to mainnet with object parsing

.PHONY: deploy-devnet-parse
deploy-devnet-parse: build publish-devnet-parse ## Build and deploy to devnet with object parsing

# Upgrade deployment commands
.PHONY: upgrade-deploy-testnet
upgrade-deploy-testnet: build upgrade-testnet ## Build and upgrade on testnet (usage: make upgrade-deploy-testnet PACKAGE_ID=0x...)

.PHONY: upgrade-deploy-mainnet
upgrade-deploy-mainnet: build upgrade-mainnet ## Build and upgrade on mainnet (usage: make upgrade-deploy-mainnet PACKAGE_ID=0x...)

.PHONY: upgrade-deploy-devnet
upgrade-deploy-devnet: build upgrade-devnet ## Build and upgrade on devnet (usage: make upgrade-deploy-devnet PACKAGE_ID=0x...)

# Enhanced upgrade deployment commands with parsing
.PHONY: upgrade-deploy-testnet-parse
upgrade-deploy-testnet-parse: build upgrade-testnet-parse ## Build and upgrade on testnet with object parsing (usage: make upgrade-deploy-testnet-parse PACKAGE_ID=0x...)

.PHONY: upgrade-deploy-mainnet-parse
upgrade-deploy-mainnet-parse: build upgrade-mainnet-parse ## Build and upgrade on mainnet with object parsing (usage: make upgrade-deploy-mainnet-parse PACKAGE_ID=0x...)

.PHONY: upgrade-deploy-devnet-parse
upgrade-deploy-devnet-parse: build upgrade-devnet-parse ## Build and upgrade on devnet with object parsing (usage: make upgrade-deploy-devnet-parse PACKAGE_ID=0x...)

# Package info
.PHONY: info
info: ## Show package information
	@echo "Package: $(PACKAGE_NAME)"
	@echo "Gas Budget: $(GAS_BUDGET)"
	@echo "Available Networks: $(NETWORK_DEVNET), $(NETWORK_TESTNET), $(NETWORK_MAINNET)"

# Upgrade management commands
.PHONY: list-upgrade-caps
list-upgrade-caps: ## List all upgrade capabilities for current address
	sui client objects --json | jq -r '.[] | select(.data.type | contains("UpgradeCap")) | "UpgradeCap: \(.data.objectId) - Package: \(.data.fields.package)"'

.PHONY: get-upgrade-cap
get-upgrade-cap: ## Get upgrade capability for a package (usage: make get-upgrade-cap PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make get-upgrade-cap PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	sui client objects --json | jq -r ".[] | select(.data.fields.package == \"$(PACKAGE_ID)\") | .data.objectId"

.PHONY: check-upgrade-eligibility
check-upgrade-eligibility: ## Check if package is eligible for upgrade (usage: make check-upgrade-eligibility PACKAGE_ID=0x...)
	@if [ -z "$(PACKAGE_ID)" ]; then \
		echo "Error: PACKAGE_ID parameter is required"; \
		echo "Usage: make check-upgrade-eligibility PACKAGE_ID=0x..."; \
		exit 1; \
	fi
	sui client object $(PACKAGE_ID) --json | jq '.data.fields.upgradePolicy'

# Quick start
.PHONY: quick-start
quick-start: build test publish-testnet ## Quick start: build, test, and deploy to testnet
	@echo "Quick start completed! Package deployed to testnet."

.PHONY: quick-start-parse
quick-start-parse: build test publish-testnet-parse ## Quick start with parsing: build, test, and deploy to testnet with object parsing
	@echo "Quick start with parsing completed! Package deployed to testnet with object details."

# Full deployment pipeline
.PHONY: deploy-full
deploy-full: clean build test publish-testnet ## Full deployment pipeline
	@echo "Full deployment pipeline completed!"
	@echo "Next steps:"
	@echo "1. Test your package on testnet"
	@echo "2. Run 'make deploy-mainnet' to deploy to mainnet"

.PHONY: deploy-full-parse
deploy-full-parse: clean build test publish-testnet-parse ## Full deployment pipeline with parsing
	@echo "Full deployment pipeline with parsing completed!"
	@echo "Next steps:"
	@echo "1. Test your package on testnet"
	@echo "2. Run 'make deploy-mainnet-parse' to deploy to mainnet with parsing"

# Upgrade workflow
.PHONY: upgrade-workflow
upgrade-workflow: ## Show upgrade workflow instructions
	@echo "Upgrade Workflow:"
	@echo "1. Make your changes to the Move code"
	@echo "2. Run 'make build' to build the package"
	@echo "3. Run 'make list-upgrade-caps' to see available upgrade capabilities"
	@echo "4. Run 'make upgrade-testnet PACKAGE_ID=0x...' to upgrade on testnet"
	@echo "5. Test the upgraded package"
	@echo "6. Run 'make upgrade-mainnet PACKAGE_ID=0x...' to upgrade on mainnet"
	@echo ""
	@echo "Note: You need the UpgradeCap object to upgrade a package"
	@echo "Use 'make get-upgrade-cap PACKAGE_ID=0x...' to find the upgrade capability"

# Deployment file management
.PHONY: list-deployments
list-deployments: ## List all deployment files
	@echo "📁 Deployment Files:"
	@echo ""
	@echo "🌐 Devnet:"
	@ls -la deployment/devnet/ 2>/dev/null || echo "  No devnet deployments found"
	@echo ""
	@echo "🧪 Testnet:"
	@ls -la deployment/testnet/ 2>/dev/null || echo "  No testnet deployments found"
	@echo ""
	@echo "🚀 Mainnet:"
	@ls -la deployment/mainnet/ 2>/dev/null || echo "  No mainnet deployments found"

.PHONY: latest-deployment
latest-deployment: ## Show latest deployment file for each network
	@echo "📋 Latest Deployments:"
	@echo ""
	@echo "🌐 Devnet:"
	@ls -t deployment/devnet/ 2>/dev/null | head -1 | xargs -I {} echo "  {}" || echo "  No devnet deployments found"
	@echo ""
	@echo "🧪 Testnet:"
	@ls -t deployment/testnet/ 2>/dev/null | head -1 | xargs -I {} echo "  {}" || echo "  No testnet deployments found"
	@echo ""
	@echo "🚀 Mainnet:"
	@ls -t deployment/mainnet/ 2>/dev/null | head -1 | xargs -I {} echo "  {}" || echo "  No mainnet deployments found"

.PHONY: parse-latest
parse-latest: ## Parse latest deployment file for current network (usage: make parse-latest NETWORK=testnet)
	@if [ -z "$(NETWORK)" ]; then \
		echo "Error: NETWORK parameter is required"; \
		echo "Usage: make parse-latest NETWORK=testnet"; \
		echo "Available networks: devnet, testnet, mainnet"; \
		exit 1; \
	fi
	@LATEST_FILE=$$(ls -t deployment/$(NETWORK)/ 2>/dev/null | head -1); \
	if [ -z "$$LATEST_FILE" ]; then \
		echo "❌ No deployment files found for $(NETWORK)"; \
		exit 1; \
	fi; \
	echo "📋 Parsing latest deployment: $$LATEST_FILE"; \
	make parse-deployment-result FILE=deployment/$(NETWORK)/$$LATEST_FILE

.PHONY: create-deployment-dirs
create-deployment-dirs: ## Create deployment directories if they don't exist
	@mkdir -p deployment/devnet deployment/testnet deployment/mainnet
	@echo "✅ Deployment directories created"

.PHONY: clean-deployments
clean-deployments: ## Clean old deployment files (keep last 5 for each network)
	@echo "🧹 Cleaning old deployment files..."
	@for network in devnet testnet mainnet; do \
		if [ -d "deployment/$$network" ]; then \
			echo "Cleaning $$network..."; \
			ls -t deployment/$$network/ | tail -n +6 | xargs -I {} rm -f deployment/$$network/{} 2>/dev/null || true; \
		fi; \
	done
	@echo "✅ Old deployment files cleaned"

# Object management utilities
.PHONY: find-object-by-type
find-object-by-type: ## Find objects by type in latest deployment (usage: make find-object-by-type TYPE=ObjectType NETWORK=testnet)
	@if [ -z "$(TYPE)" ] || [ -z "$(NETWORK)" ]; then \
		echo "Error: TYPE and NETWORK parameters are required"; \
		echo "Usage: make find-object-by-type TYPE=ObjectType NETWORK=testnet"; \
		echo "Example: make find-object-by-type TYPE=UpgradeCap NETWORK=testnet"; \
		exit 1; \
	fi
	@LATEST_FILE=$$(ls -t deployment/$(NETWORK)/ 2>/dev/null | head -1); \
	if [ -z "$$LATEST_FILE" ]; then \
		echo "❌ No deployment files found for $(NETWORK)"; \
		exit 1; \
	fi; \
	echo "🔍 Finding $(TYPE) objects in latest $(NETWORK) deployment: $$LATEST_FILE"; \
	make extract-specific-objects FILE=deployment/$(NETWORK)/$$LATEST_FILE TYPE=$(TYPE)

.PHONY: get-package-id
get-package-id: ## Get package ID from latest deployment (usage: make get-package-id NETWORK=testnet)
	@if [ -z "$(NETWORK)" ]; then \
		echo "Error: NETWORK parameter is required"; \
		echo "Usage: make get-package-id NETWORK=testnet"; \
		exit 1; \
	fi
	@LATEST_FILE=$$(ls -t deployment/$(NETWORK)/ 2>/dev/null | head -1); \
	if [ -z "$$LATEST_FILE" ]; then \
		echo "❌ No deployment files found for $(NETWORK)"; \
		exit 1; \
	fi; \
	echo "📦 Package ID from latest $(NETWORK) deployment:"; \
	jq -r '.objectChanges[] | select(.type == "published") | .packageId' deployment/$(NETWORK)/$$LATEST_FILE 2>/dev/null || echo "❌ No package ID found"

# Comprehensive object extraction
.PHONY: extract-all-objects
extract-all-objects: ## Extract all important objects from deployment file (usage: make extract-all-objects FILE=path/to/file)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: FILE parameter is required"; \
		echo "Usage: make extract-all-objects FILE=path/to/file"; \
		exit 1; \
	fi
	@echo "🔍 Extracting all important objects from $(FILE)..."
	@echo ""
	@# Check if file is JSON format
	@if jq empty $(FILE) 2>/dev/null; then \
		echo "📦 Package ID:"; \
		jq -r '.objectChanges[] | select(.type == "published") | .packageId' $(FILE) 2>/dev/null || echo "❌ No package ID found"; \
		echo ""; \
		echo "🔧 UpgradeCap:"; \
		jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("UpgradeCap"))) | .objectId' $(FILE) 2>/dev/null || echo "❌ No UpgradeCap found"; \
		echo ""; \
		echo "🏛️ AdminCap:"; \
		jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("AdminCap"))) | .objectId' $(FILE) 2>/dev/null || echo "❌ No AdminCap found"; \
		echo ""; \
		echo "🎫 TicketTransferPolicy:"; \
		jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("TransferPolicy"))) | .objectId' $(FILE) 2>/dev/null || echo "❌ No TransferPolicy found"; \
		echo ""; \
		echo "🎫 TicketTransferPolicyCap:"; \
		jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("TransferPolicyCap"))) | .objectId' $(FILE) 2>/dev/null || echo "❌ No TransferPolicyCap found"; \
		echo ""; \
		echo "🏢 Platform:"; \
		jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("Platform"))) | .objectId' $(FILE) 2>/dev/null || echo "❌ No Platform found"; \
		echo ""; \
		echo "🎪 OrganizerCap:"; \
		jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("OrganizerCap"))) | .objectId' $(FILE) 2>/dev/null || echo "❌ No OrganizerCap found"; \
		echo ""; \
		echo "👤 UserCap:"; \
		jq -r '.objectChanges[] | select(.type == "created" and (.objectType | contains("UserCap"))) | .objectId' $(FILE) 2>/dev/null || echo "❌ No UserCap found"; \
	else \
		echo "📦 Package ID:"; \
		grep -oE "Package ID: 0x[a-fA-F0-9]+" $(FILE) | head -1 || echo "❌ No package ID found"; \
		echo ""; \
		echo "🔧 UpgradeCap:"; \
		grep -i "UpgradeCap" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -5 || echo "❌ No UpgradeCap found"; \
		echo ""; \
		echo "🏛️ AdminCap:"; \
		grep -i "AdminCap" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -5 || echo "❌ No AdminCap found"; \
		echo ""; \
		echo "🎫 TicketTransferPolicy:"; \
		grep -i "TransferPolicy" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -5 || echo "❌ No TransferPolicy found"; \
		echo ""; \
		echo "🎫 TicketTransferPolicyCap:"; \
		grep -i "TransferPolicyCap" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -5 || echo "❌ No TransferPolicyCap found"; \
		echo ""; \
		echo "🏢 Platform:"; \
		grep -i "Platform" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -5 || echo "❌ No Platform found"; \
		echo ""; \
		echo "🎪 OrganizerCap:"; \
		grep -i "OrganizerCap" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -5 || echo "❌ No OrganizerCap found"; \
		echo ""; \
		echo "👤 UserCap:"; \
		grep -i "UserCap" $(FILE) | grep -oE "Object ID: 0x[a-fA-F0-9]+" | head -5 || echo "❌ No UserCap found"; \
	fi
	@echo ""
	@echo "✅ Object extraction completed!"

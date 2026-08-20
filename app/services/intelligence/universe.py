from typing import Dict, List, Optional, Set, Any
import re


# Curated, Extensible Universe of NSE-Listed Leaders & Core Mid-caps across 33 Sectors
NSE_SECTOR_UNIVERSE: Dict[str, List[Dict[str, Any]]] = {
    "Banking - Private": [
        {"ticker": "HDFCBANK", "name": "HDFC Bank Ltd.", "sub": "Private Bank", "tags": ["rate_sensitive", "credit_growth"]},
        {"ticker": "ICICIBANK", "name": "ICICI Bank Ltd.", "sub": "Private Bank", "tags": ["rate_sensitive", "credit_growth"]},
        {"ticker": "KOTAKBANK", "name": "Kotak Mahindra Bank Ltd.", "sub": "Private Bank", "tags": ["rate_sensitive", "wealth_management"]},
        {"ticker": "AXISBANK", "name": "Axis Bank Ltd.", "sub": "Private Bank", "tags": ["rate_sensitive", "corporate_banking"]},
        {"ticker": "INDUSINDBK", "name": "IndusInd Bank Ltd.", "sub": "Private Bank", "tags": ["vehicle_finance", "microfinance"]},
        {"ticker": "FEDERALBNK", "name": "Federal Bank Ltd.", "sub": "Regional Private Bank", "tags": ["nri_remittances", "sme_banking"]},
        {"ticker": "IDFCFIRSTB", "name": "IDFC First Bank Ltd.", "sub": "Retail Private Bank", "tags": ["consumer_credit", "retail_deposits"]},
    ],
    "Banking - Public (PSU)": [
        {"ticker": "SBIN", "name": "State Bank of India", "sub": "PSU Bank", "tags": ["sovereign_backed", "infra_credit", "rate_sensitive"]},
        {"ticker": "BANKBARODA", "name": "Bank of Baroda", "sub": "PSU Bank", "tags": ["corporate_credit", "treasury"]},
        {"ticker": "PNB", "name": "Punjab National Bank", "sub": "PSU Bank", "tags": ["psu_turnaround", "retail_msme"]},
        {"ticker": "CANBK", "name": "Canara Bank", "sub": "PSU Bank", "tags": ["agriculture", "credit_expansion"]},
        {"ticker": "UNIONBANK", "name": "Union Bank of India", "sub": "PSU Bank", "tags": ["psu_recovery", "industrial_loans"]},
        {"ticker": "INDIANB", "name": "Indian Bank", "sub": "PSU Bank", "tags": ["asset_quality", "southern_expansion"]},
    ],
    "NBFC & Housing Finance": [
        {"ticker": "BAJFINANCE", "name": "Bajaj Finance Ltd.", "sub": "Consumer NBFC", "tags": ["consumer_credit", "omnichannel", "rate_sensitive"]},
        {"ticker": "BAJAJFINSV", "name": "Bajaj Finserv Ltd.", "sub": "Financial Conglomerate", "tags": ["insurance", "lending"]},
        {"ticker": "CHOLAFIN", "name": "Cholamandalam Investment & Fin.", "sub": "Vehicle NBFC", "tags": ["commercial_vehicles", "rural_lending"]},
        {"ticker": "SHRIRAMFIN", "name": "Shriram Finance Ltd.", "sub": "Commercial Vehicle NBFC", "tags": ["used_trucks", "msme"]},
        {"ticker": "MUTHOOTFIN", "name": "Muthoot Finance Ltd.", "sub": "Gold Loan NBFC", "tags": ["gold_price_sensitive", "collateralized"]},
        {"ticker": "LICHSGFIN", "name": "LIC Housing Finance Ltd.", "sub": "Housing Finance", "tags": ["affordable_housing", "mortgage_rates"]},
        {"ticker": "LTF", "name": "L&T Finance Ltd.", "sub": "Retail NBFC", "tags": ["two_wheeler_finance", "farm_equipment"]},
        {"ticker": "EDELWEISS", "name": "Edelweiss Financial Services", "sub": "Asset Reconstruction & Credit", "tags": ["npl_resolution", "wealth"]},
    ],
    "Insurance & Asset Management": [
        {"ticker": "HDFCLIFE", "name": "HDFC Life Insurance Co.", "sub": "Life Insurance", "tags": ["protection_products", "annuity"]},
        {"ticker": "SBILIFE", "name": "SBI Life Insurance Co.", "sub": "Life Insurance", "tags": ["bancassurance", "ulip"]},
        {"ticker": "ICICIPRULI", "name": "ICICI Prudential Life Insurance", "sub": "Life Insurance", "tags": ["persistency", "vnb_margins"]},
        {"ticker": "GICRE", "name": "General Insurance Corp. of India", "sub": "Reinsurance", "tags": ["crop_insurance", "global_reinsurance"]},
        {"ticker": "HDFCAMC", "name": "HDFC Asset Management Co.", "sub": "Mutual Fund AMC", "tags": ["equity_inflows", "financialization"]},
        {"ticker": "NIPPONLIFE", "name": "Nippon Life India Asset Mgmt", "sub": "Mutual Fund AMC", "tags": ["etfs", "sip_growth"]},
    ],
    "Information Technology & Software": [
        {"ticker": "TCS", "name": "Tata Consultancy Services", "sub": "Global IT Services", "tags": ["us_spending", "cloud_ai", "bfsi_tech"]},
        {"ticker": "INFY", "name": "Infosys Ltd.", "sub": "Global IT Services", "tags": ["digital_transformation", "generative_ai"]},
        {"ticker": "HCLTECH", "name": "HCL Technologies Ltd.", "sub": "IT Infrastructure & Software", "tags": ["engineering_services", "products"]},
        {"ticker": "WIPRO", "name": "Wipro Ltd.", "sub": "Global IT Services", "tags": ["consulting", "cloud"]},
        {"ticker": "TECHM", "name": "Tech Mahindra Ltd.", "sub": "Telecom & Enterprise IT", "tags": ["5g_enterprise", "network_services"]},
        {"ticker": "LTIM", "name": "LTIMindtree Ltd.", "sub": "Mid-tier Global IT", "tags": ["cross_selling", "banking_tech"]},
        {"ticker": "PERSISTENT", "name": "Persistent Systems Ltd.", "sub": "Software Product Engineering", "tags": ["healthcare_tech", "hyperscalers"]},
        {"ticker": "COFORGE", "name": "Coforge Ltd.", "sub": "Vertical IT Solutions", "tags": ["travel_transport", "insurance_tech"]},
        {"ticker": "KPITTECH", "name": "KPIT Technologies Ltd.", "sub": "Automotive Embedded Software", "tags": ["ev_software", "autonomous_driving"]},
        {"ticker": "TATAELXSI", "name": "Tata Elxsi Ltd.", "sub": "Design & Engineering", "tags": ["connected_vehicles", "medical_devices"]},
    ],
    "Oil, Gas Exploration & Refining": [
        {"ticker": "RELIANCE", "name": "Reliance Industries Ltd.", "sub": "Oil to Chemicals & Conglomerate", "tags": ["crude_refining", "telecom", "retail", "crude_positive"]},
        {"ticker": "ONGC", "name": "Oil & Natural Gas Corp.", "sub": "Upstream Exploration & Production", "tags": ["crude_positive", "brent_beneficiary", "natural_gas_pricing"]},
        {"ticker": "OIL", "name": "Oil India Ltd.", "sub": "Upstream Exploration", "tags": ["crude_positive", "numaligarh_refinery"]},
        {"ticker": "BPCL", "name": "Bharat Petroleum Corp. Ltd.", "sub": "Downstream Refining & Fuel Retail", "tags": ["refining_margin", "fuel_pricing", "crude_negative"]},
        {"ticker": "IOC", "name": "Indian Oil Corp. Ltd.", "sub": "Downstream Refining & Pipelines", "tags": ["petrochemicals", "fuel_subsidies", "crude_negative"]},
        {"ticker": "HPCL", "name": "Hindustan Petroleum Corp.", "sub": "Downstream Refining & Retail", "tags": ["marketing_margin", "crude_negative"]},
        {"ticker": "MRPL", "name": "Mangalore Refinery & Petrochem", "sub": "Stand-alone Refining", "tags": ["gross_refining_margin", "crude_negative"]},
    ],
    "City Gas Distribution & LNG": [
        {"ticker": "GAIL", "name": "GAIL (India) Ltd.", "sub": "Natural Gas Transmission & Marketing", "tags": ["pipeline_tariff", "petrochemicals"]},
        {"ticker": "IGL", "name": "Indraprastha Gas Ltd.", "sub": "City Gas Distribution (Delhi NCR)", "tags": ["cng_ev_conversion", "png_domestic"]},
        {"ticker": "MGL", "name": "Mahanagar Gas Ltd.", "sub": "City Gas Distribution (Mumbai)", "tags": ["cng_pricing", "industrial_gas"]},
        {"ticker": "GUJGASLTD", "name": "Gujarat Gas Ltd.", "sub": "City Gas Distribution (Gujarat)", "tags": ["ceramic_cluster", "industrial_png"]},
        {"ticker": "PETRONET", "name": "Petronet LNG Ltd.", "sub": "LNG Regasification Terminals", "tags": ["lng_imports", "dahej_expansion"]},
    ],
    "Power Generation & Transmission": [
        {"ticker": "NTPC", "name": "NTPC Ltd.", "sub": "Thermal & Green Power Utility", "tags": ["peak_power_demand", "renewable_transition", "regulated_equity"]},
        {"ticker": "POWERGRID", "name": "Power Grid Corp. of India", "sub": "National Power Transmission Grid", "tags": ["interstate_transmission", "renewable_evacuation"]},
        {"ticker": "TATAPOWER", "name": "Tata Power Co. Ltd.", "sub": "Integrated Power & Solar Rooftop", "tags": ["ev_charging", "solar_epc", "distribution"]},
        {"ticker": "ADANIPOWER", "name": "Adani Power Ltd.", "sub": "Thermal Power Generation", "tags": ["ppa_contracts", "merchant_tariffs"]},
        {"ticker": "JSWENERGY", "name": "JSW Energy Ltd.", "sub": "Diversified Power Utility", "tags": ["hydro_generation", "storage_batteries"]},
        {"ticker": "NHPC", "name": "NHPC Ltd.", "sub": "Hydroelectric Power", "tags": ["pumped_storage", "monsoon_hydrology"]},
        {"ticker": "CESC", "name": "CESC Ltd.", "sub": "Power Generation & Distribution", "tags": ["kolkata_distribution", "renewables"]},
        {"ticker": "VEDPOWER", "name": "Vedanta Power / Energy", "sub": "Captive Power Generation", "tags": ["smelting_power", "industrial_energy"]},
    ],
    "Renewable & Clean Energy": [
        {"ticker": "SUZLON", "name": "Suzlon Energy Ltd.", "sub": "Wind Turbine Manufacturer & EPC", "tags": ["wind_capex", "repowering", "deleveraged"]},
        {"ticker": "INOXWIND", "name": "Inox Wind Ltd.", "sub": "Wind Energy Equipment", "tags": ["3mw_turbines", "order_backlog"]},
        {"ticker": "BORORENEW", "name": "Borosil Renewables Ltd.", "sub": "Solar Glass Manufacturing", "tags": ["solar_tariffs", "anti_dumping"]},
        {"ticker": "ADANIGREEN", "name": "Adani Green Energy Ltd.", "sub": "Renewable Power IPP", "tags": ["khavda_solar_park", "hybrid_power"]},
        {"ticker": "WAAREEENER", "name": "Waaree Energies Ltd.", "sub": "Solar PV Module Manufacturer", "tags": ["solar_export", "domestic_content"]},
    ],
    "Defence & Aerospace": [
        {"ticker": "HAL", "name": "Hindustan Aeronautics Ltd.", "sub": "Military Aircraft & Helicopters", "tags": ["indigenization", "tejas_fighter", "defence_capex"]},
        {"ticker": "BEL", "name": "Bharat Electronics Ltd.", "sub": "Defence Radars & Avionics", "tags": ["electronic_warfare", "missile_systems"]},
        {"ticker": "BDL", "name": "Bharat Dynamics Ltd.", "sub": "Missiles & Torpedoes", "tags": ["akash_missile", "anti_tank_weapons"]},
        {"ticker": "MAZDOCK", "name": "Mazagon Dock Shipbuilders Ltd.", "sub": "Submarines & Warships", "tags": ["project_75i", "destroyers"]},
        {"ticker": "COCHINSHIP", "name": "Cochin Shipyard Ltd.", "sub": "Aircraft Carriers & Ship Repair", "tags": ["indigenous_carrier", "green_vessels"]},
        {"ticker": "GRSE", "name": "Garden Reach Shipbuilders", "sub": "Frigates & Patrol Vessels", "tags": ["warship_exports", "naval_orders"]},
        {"ticker": "SOLARINDS", "name": "Solar Industries India Ltd.", "sub": "Industrial & Military Explosives", "tags": ["pinaka_rockets", "drones_warheads"]},
    ],
    "Railways & Rail Infrastructure": [
        {"ticker": "IRCTC", "name": "Indian Railway Catering & Tourism", "sub": "Railway Ticketing & Catering", "tags": ["vande_bharat", "tourism_monopoly"]},
        {"ticker": "IRFC", "name": "Indian Railway Finance Corp.", "sub": "Rail Leasing & Financing", "tags": ["capex_financing", "zero_npa_sovereign"]},
        {"ticker": "RVNL", "name": "Rail Vikas Nigam Ltd.", "sub": "Rail EPC & Track Doubling", "tags": ["metro_rail", "high_speed_rail"]},
        {"ticker": "RAILTEL", "name": "RailTel Corp. of India", "sub": "Telecom & Optical Fibre along Tracks", "tags": ["kavach_safety", "data_centres"]},
        {"ticker": "RITES", "name": "RITES Ltd.", "sub": "Rail Consulting & Export Rolling Stock", "tags": ["rolling_stock_exports", "consultancy"]},
        {"ticker": "TITAGARH", "name": "Titagarh Rail Systems Ltd.", "sub": "Passenger Coaches & Wagons", "tags": ["vande_bharat_sleepers", "metro_coaches"]},
        {"ticker": "JUPITERWAG", "name": "Jupiter Wagons Ltd.", "sub": "Freight Wagons & Braking Systems", "tags": ["dedicated_freight_corridor", "braking"]},
    ],
    "Infrastructure, Engineering & Construction": [
        {"ticker": "LT", "name": "Larsen & Toubro Ltd.", "sub": "Heavy Engineering, EPC & Tech", "tags": ["order_inflows", "middle_east_capex", "infra_capex"]},
        {"ticker": "NCC", "name": "NCC Ltd.", "sub": "Civil Construction & Buildings", "tags": ["water_projects", "roads_highways"]},
        {"ticker": "GMRINFRA", "name": "GMR Airports Infrastructure Ltd.", "sub": "Airport Development & Operations", "tags": ["passenger_traffic", "duty_free"]},
        {"ticker": "KNRCON", "name": "KNR Constructions Ltd.", "sub": "Highway & Irrigation EPC", "tags": ["ham_projects", "nhai_orders"]},
        {"ticker": "PNCINFRA", "name": "PNC Infratech Ltd.", "sub": "Expressways & Water Infrastructure", "tags": ["expressways", "water_supply"]},
    ],
    "Capital Goods & Heavy Electrical": [
        {"ticker": "SIEMENS", "name": "Siemens India Ltd.", "sub": "Industrial Automation & Mobility", "tags": ["factory_digitization", "locomotives"]},
        {"ticker": "ABB", "name": "ABB India Ltd.", "sub": "Robotics, Motion & Power Grids", "tags": ["electrification", "energy_efficiency"]},
        {"ticker": "BHEL", "name": "Bharat Heavy Electricals Ltd.", "sub": "Thermal Turbines & Locomotives", "tags": ["supercritical_boilers", "rail_propulsion"]},
        {"ticker": "THERMAX", "name": "Thermax Ltd.", "sub": "Boilers, Waste Heat & Green Hydrogen", "tags": ["decarbonization", "biomass_boilers"]},
        {"ticker": "CUMMINSIND", "name": "Cummins India Ltd.", "sub": "Diesel & Gas Engines, Gensets", "tags": ["cpcb4_norms", "data_center_power"]},
        {"ticker": "BEML", "name": "BEML Ltd.", "sub": "Mining, Defence & Rail Equipment", "tags": ["vande_bharat_trainsets", "heavy_earthmoving"]},
        {"ticker": "AIAENG", "name": "AIA Engineering Ltd.", "sub": "High Chrome Grinding Media", "tags": ["gold_copper_mining", "cement_grinding"]},
    ],
    "Automobile - Passenger, CV & 2W": [
        {"ticker": "MARUTI", "name": "Maruti Suzuki India Ltd.", "sub": "Passenger Vehicles & Hybrid Tech", "tags": ["suv_market_share", "cng_hybrids", "rural_demand"]},
        {"ticker": "TATAMOTORS", "name": "Tata Motors Ltd.", "sub": "Commercial Vehicles, PVs & JLR", "tags": ["jlr_margins", "ev_leader", "cv_freight_cycle"]},
        {"ticker": "M&M", "name": "Mahindra & Mahindra Ltd.", "sub": "SUVs & Farm Tractors", "tags": ["monsoon_demand", "thar_scorpio_orderbook"]},
        {"ticker": "BAJAJ-AUTO", "name": "Bajaj Auto Ltd.", "sub": "Two Wheelers, 3W & Exports", "tags": ["latam_africa_exports", "chetak_ev", "triumph"]},
        {"ticker": "HEROMOTOCO", "name": "Hero MotoCorp Ltd.", "sub": "Entry/Executive 2-Wheelers", "tags": ["rural_consumption", "harley_vida"]},
        {"ticker": "TVSMOTOR", "name": "TVS Motor Company Ltd.", "sub": "Two Wheelers & EV Scooters", "tags": ["iqube_ev", "premium_motorcycles"]},
        {"ticker": "EICHERMOT", "name": "Eicher Motors Ltd.", "sub": "Royal Enfield & VECV Commercial", "tags": ["premium_cruisers", "interceptor"]},
        {"ticker": "ASHOKLEY", "name": "Ashok Leyland Ltd.", "sub": "Medium & Heavy Commercial Vehicles", "tags": ["infra_trucking", "bus_electrification"]},
    ],
    "Auto Ancillaries, Tyres & Batteries": [
        {"ticker": "MOTHERSON", "name": "Samvardhana Motherson Int.", "sub": "Wiring Harnesses & Vision Systems", "tags": ["global_oem_supply", "content_per_car"]},
        {"ticker": "BOSCHLTD", "name": "Bosch Ltd.", "sub": "Powertrain & Automotive Electronics", "tags": ["emission_systems", "advanced_braking"]},
        {"ticker": "BHARATFORG", "name": "Bharat Forge Ltd.", "sub": "Forging, Artillery & Aerospace", "tags": ["defence_artillery", "us_class8_trucks"]},
        {"ticker": "MRF", "name": "MRF Ltd.", "sub": "Automotive Tyres", "tags": ["rubber_price_sensitive", "crude_negative", "oem_replacement"]},
        {"ticker": "APOLLOTYRE", "name": "Apollo Tyres Ltd.", "sub": "Truck & Passenger Tyres", "tags": ["european_margins", "crude_negative"]},
        {"ticker": "CEATLTD", "name": "CEAT Ltd.", "sub": "Tyres & Off-highway Tyres", "tags": ["2w_passenger_tyres", "raw_material_costs"]},
        {"ticker": "EXIDEIND", "name": "Exide Industries Ltd.", "sub": "Lead Acid & Lithium-ion Cells", "tags": ["li_ion_gigafactory", "ev_batteries"]},
        {"ticker": "AMARAJABAT", "name": "Amara Raja Energy & Mobility", "sub": "Automotive & Industrial Batteries", "tags": ["telecom_batteries", "gigafactory"]},
        {"ticker": "ENDURANCE", "name": "Endurance Technologies Ltd.", "sub": "Aluminium Die Casting & Brakes", "tags": ["2w_brakes", "ev_components"]},
    ],
    "Pharmaceuticals - Formulations & APIs": [
        {"ticker": "SUNPHARMA", "name": "Sun Pharmaceutical Ind. Ltd.", "sub": "Global Specialty Pharma & Generics", "tags": ["us_specialty_dermatology", "india_formulations"]},
        {"ticker": "DRREDDY", "name": "Dr. Reddy's Laboratories Ltd.", "sub": "Biosimilars & US Generics", "tags": ["gRevlimid", "china_expansion", "cdmo"]},
        {"ticker": "CIPLA", "name": "Cipla Ltd.", "sub": "Respiratory, Inhalers & Domestic OTC", "tags": ["albuterol_inhalers", "trade_generics"]},
        {"ticker": "LAURUSLABS", "name": "Laurus Labs Ltd.", "sub": "ARV APIs, CDMO & Bio-manufacturing", "tags": ["cdmo_synthesis", "usfda_approvals", "biologics"]},
        {"ticker": "DIVISLAB", "name": "Divi's Laboratories Ltd.", "sub": "Active Pharma Ingredients & Custom Synthesis", "tags": ["glenmark_contrast_media", "patented_apis"]},
        {"ticker": "LUPIN", "name": "Lupin Ltd.", "sub": "Respiratory & US Complex Generics", "tags": ["spiriva_generic", "usfda_compliance"]},
        {"ticker": "ZYDUSLIFE", "name": "Zydus Lifesciences Ltd.", "sub": "Formulations, NCE & Animal Health", "tags": ["us_mirabegron", "saroglitazar"]},
        {"ticker": "TORNTPHARM", "name": "Torrent Pharmaceuticals Ltd.", "sub": "Chronic Therapies (CVD, CNS)", "tags": ["curatio_integration", "brazil_germany"]},
        {"ticker": "AUROPHARMA", "name": "Aurobindo Pharma Ltd.", "sub": "Injectables & Oral Solids", "tags": ["eugia_injectables", "pli_penicillin_g"]},
        {"ticker": "ALKEM", "name": "Alkem Laboratories Ltd.", "sub": "Anti-infectives & Gastro Formulations", "tags": ["domestic_formulations", "acute_chronic"]},
    ],
    "Healthcare, Hospitals & Diagnostics": [
        {"ticker": "APOLLOHOSP", "name": "Apollo Hospitals Enterprise", "sub": "Multi-specialty Hospitals & Apollo 24/7", "tags": ["arppu_expansion", "digital_pharmacy", "transplants"]},
        {"ticker": "MAXHEALTH", "name": "Max Healthcare Institute Ltd.", "sub": "Tertiary Hospitals (Metro Focus)", "tags": ["ncr_mumbai_expansion", "bed_additions"]},
        {"ticker": "FORTIS", "name": "Fortis Healthcare Ltd.", "sub": "Hospital Network & SRL Diagnostics", "tags": ["turnaround", "diagnostics_spin_off"]},
        {"ticker": "MEDANTA", "name": "Global Health Ltd. (Medanta)", "sub": "Super-specialty Hospitals", "tags": ["cardiology_neuro", "tier2_expansion"]},
        {"ticker": "LALPATHLAB", "name": "Dr. Lal PathLabs Ltd.", "sub": "Pathology Diagnostics Network", "tags": ["swasth_packages", "b2c_wellness"]},
        {"ticker": "METROPOLIS", "name": "Metropolis Healthcare Ltd.", "sub": "Specialized Pathology Diagnostics", "tags": ["wellness_testing", "western_southern_india"]},
    ],
    "Chemicals, Specialty Chemicals & Agrochem": [
        {"ticker": "SRF", "name": "SRF Ltd.", "sub": "Fluorochemicals, Specialty Chem & Packaging", "tags": ["hfc_refrigerants", "agrochemical_intermediates"]},
        {"ticker": "PIIND", "name": "PI Industries Ltd.", "sub": "Agrochem Custom Synthesis (CSM)", "tags": ["csm_export_orders", "pharma_cdmo"]},
        {"ticker": "DEEPAKNTR", "name": "Deepak Nitrite Ltd.", "sub": "Phenol, Acetone & Specialty Chemicals", "tags": ["basic_intermediates", "polycarbonate"]},
        {"ticker": "FLUOROCHEM", "name": "Gujarat Fluorochemicals Ltd.", "sub": "Fluoropolymers, Battery Chemicals", "tags": ["pvdf_ev_batteries", "refrigerants"]},
        {"ticker": "AARTIIND", "name": "Aarti Industries Ltd.", "sub": "Benzene Derivatives & Specialty Chem", "tags": ["chlorotoluenes", "long_term_contracts"]},
        {"ticker": "NAVINFLUOR", "name": "Navin Fluorine International", "sub": "High-purity Fluorochemicals", "tags": ["cram_specialty", "hfo_specialty"]},
        {"ticker": "ATUL", "name": "Atul Ltd.", "sub": "Aromatics, Dyes & Polymers", "tags": ["crop_protection", "epoxy_resins"]},
        {"ticker": "TATACHEM", "name": "Tata Chemicals Ltd.", "sub": "Soda Ash & Bicarbonate", "tags": ["solar_glass_demand", "container_glass"]},
        {"ticker": "UPL", "name": "UPL Ltd.", "sub": "Post-patent Crop Protection & Biosolutions", "tags": ["latam_farming", "deleveraging"]},
        {"ticker": "COROMANDEL", "name": "Coromandel International Ltd.", "sub": "Phosphatic Fertilizers & Crop Protection", "tags": ["complex_fertilizers", "nano_dap"]},
    ],
    "Metals & Mining (Steel)": [
        {"ticker": "TATASTEEL", "name": "Tata Steel Ltd.", "sub": "Integrated Steel Manufacturer", "tags": ["kalinganagar_expansion", "uk_electric_arc", "china_steel_tariffs"]},
        {"ticker": "JSWSTEEL", "name": "JSW Steel Ltd.", "sub": "Flat & Long Steel Manufacturer", "tags": ["capacity_doubling", "automotive_steel"]},
        {"ticker": "JINDALSTEL", "name": "Jindal Steel & Power Ltd.", "sub": "Steel & Pellets, Heavy Rails", "tags": ["angul_steel_expansion", "bullet_train_rails"]},
        {"ticker": "SAIL", "name": "Steel Authority of India Ltd.", "sub": "PSU Integrated Steelmaker", "tags": ["railways_steel", "infra_rebars"]},
        {"ticker": "NMDC", "name": "NMDC Ltd.", "sub": "Iron Ore Mining", "tags": ["iron_ore_royalty", "production_volume"]},
        {"ticker": "VISL", "name": "Vardhman Ispat / Steels", "sub": "Specialty & Alloy Steels", "tags": ["auto_components_steel", "industrial_rods"]},
    ],
    "Non-Ferrous Metals & Mining": [
        {"ticker": "HINDALCO", "name": "Hindalco Industries Ltd.", "sub": "Aluminium, Novelis Beverage Cans & Copper", "tags": ["lme_aluminium", "novelis_cans", "copper_ev"]},
        {"ticker": "NATIONALUM", "name": "National Aluminium Co. (NALCO)", "sub": "Alumina & Aluminium Smelting", "tags": ["low_cost_bauxite", "alumina_exports"]},
        {"ticker": "VEDL", "name": "Vedanta Ltd.", "sub": "Diversified Metals, Zinc, Aluminium & Oil", "tags": ["dividend_yield", "demerger_value"]},
        {"ticker": "COALINDIA", "name": "Coal India Ltd.", "sub": "Thermal Coal Mining Monopoly", "tags": ["power_plant_offtake", "fsa_e_auction"]},
        {"ticker": "HINDZINC", "name": "Hindustan Zinc Ltd.", "sub": "Zinc, Lead & Silver Mining", "tags": ["lme_zinc", "silver_rally"]},
    ],
    "Cement & Building Materials": [
        {"ticker": "ULTRACEMCO", "name": "UltraTech Cement Ltd.", "sub": "India's Largest Cement Producer", "tags": ["pan_india_capacity", "infra_housing_demand", "energy_costs"]},
        {"ticker": "AMBUJACEM", "name": "Ambuja Cements Ltd.", "sub": "Integrated Cement Producer (Adani Group)", "tags": ["synergies_logistics", "green_power_cement"]},
        {"ticker": "ACC", "name": "ACC Ltd.", "sub": "Ready Mix Concrete & Cement", "tags": ["clinker_efficiency", "metro_corridors"]},
        {"ticker": "SHREECEM", "name": "Shree Cement Ltd.", "sub": "Low-cost Cement Manufacturer", "tags": ["north_east_markets", "alternative_fuels"]},
        {"ticker": "DALBHARAT", "name": "Dalmia Bharat Ltd.", "sub": "Southern & Eastern India Cement", "tags": ["south_pricing", "capex_commissioning"]},
        {"ticker": "JKCEMENT", "name": "JK Cement Ltd.", "sub": "Grey & White Cement, Wall Putty", "tags": ["paints_expansion", "central_india"]},
        {"ticker": "NITCO", "name": "Nitco Ltd.", "sub": "Ceramic Tiles & Marble", "tags": ["real_estate_finishing", "renovation"]},
        {"ticker": "KAJARIACER", "name": "Kajaria Ceramics Ltd.", "sub": "Vitrified & Glazed Tiles", "tags": ["housing_completion", "gas_cost_input"]},
        {"ticker": "ASTRAL", "name": "Astral Ltd.", "sub": "CPVC Plumbing Pipes & Adhesives", "tags": ["plumbing_real_estate", "infrastructure_pipes"]},
        {"ticker": "SUPREMEIND", "name": "Supreme Industries Ltd.", "sub": "Plastic Piping & Moulded Furniture", "tags": ["pvc_resin_pricing", "jal_jeevan_mission"]},
    ],
    "FMCG & Consumer Staples": [
        {"ticker": "HINDUNILVR", "name": "Hindustan Unilever Ltd.", "sub": "Diversified FMCG (Personal Care & Foods)", "tags": ["rural_recovery", "raw_material_deflation"]},
        {"ticker": "ITC", "name": "ITC Ltd.", "sub": "FMCG, Cigarettes, Agri & Hotels", "tags": ["hotel_demerger", "stable_tobacco_taxes"]},
        {"ticker": "NESTLEIND", "name": "Nestle India Ltd.", "sub": "Infant Nutrition & Packaged Foods", "tags": ["maggi_noodles", "premiumization"]},
        {"ticker": "BRITANNIA", "name": "Britannia Industries Ltd.", "sub": "Biscuits, Bakery & Dairy", "tags": ["wheat_palm_oil_costs", "distribution_reach"]},
        {"ticker": "DABUR", "name": "Dabur India Ltd.", "sub": "Ayurvedic Healthcare & Juices", "tags": ["herbal_wellness", "rural_penetration"]},
        {"ticker": "MARICO", "name": "Marico Ltd.", "sub": "Hair Oils, Edible Oils & Foods", "tags": ["copra_raw_material", "saffola"]},
        {"ticker": "GODREJCP", "name": "Godrej Consumer Products Ltd.", "sub": "Home Insecticides & Soaps", "tags": ["indonesia_africa", "park_avenue"]},
        {"ticker": "TATACONSUM", "name": "Tata Consumer Products Ltd.", "sub": "Tea, Salt, Coffee, Pulses & Organic", "tags": ["capital_foods_ching", "organic_india"]},
        {"ticker": "VBL", "name": "Varun Beverages Ltd.", "sub": "PepsiCo Franchisee Bottler", "tags": ["summer_beverage_demand", "africa_expansion"]},
    ],
    "Consumer Discretionary, Retail & Footwear": [
        {"ticker": "TITAN", "name": "Titan Company Ltd.", "sub": "Tanishq Jewellery, Eyewear & Watches", "tags": ["gold_customs_duty", "wedding_season", "hallmarking"]},
        {"ticker": "TRENT", "name": "Trent Ltd.", "sub": "Zudio, Westside & Star Bazaar Retail", "tags": ["fast_fashion_zudio", "store_expansion"]},
        {"ticker": "DMART", "name": "Avenue Supermarts Ltd. (DMart)", "sub": "Discount Grocery & General Merchandise", "tags": ["store_additions", "everyday_low_price"]},
        {"ticker": "ABFRL", "name": "Aditya Birla Fashion & Retail", "sub": "Pantaloons, Louis Philippe & Ethnic", "tags": ["demerger", "casual_wear"]},
        {"ticker": "BATAINDIA", "name": "Bata India Ltd.", "sub": "Footwear & Retail", "tags": ["sneakerization", "casual_transition"]},
        {"ticker": "RELAXO", "name": "Relaxo Footwears Ltd.", "sub": "Open Footwear & Hawaii Slippers", "tags": ["eva_polymer_prices", "rural_mass_market"]},
        {"ticker": "METROBRAND", "name": "Metro Brands Ltd.", "sub": "Premium Footwear (Mochi, Crocs, Fila)", "tags": ["crocs_expansion", "mall_retail"]},
        {"ticker": "PCJEWELLER", "name": "PC Jeweller Ltd.", "sub": "Retail Jewellery", "tags": ["debt_restructuring", "gold_wedding"]},
    ],
    "Quick Service Restaurants (QSR)": [
        {"ticker": "JUBLFOOD", "name": "Jubilant FoodWorks Ltd.", "sub": "Domino's Pizza & Popeyes", "tags": ["same_store_sales", "free_delivery_loyalty"]},
        {"ticker": "DEVYANI", "name": "Devyani International Ltd.", "sub": "KFC, Pizza Hut & Costa Coffee", "tags": ["kfc_expansion", "thailand_acquisition"]},
        {"ticker": "WESTLIFE", "name": "Westlife Foodworld Ltd.", "sub": "McDonald's (West & South India)", "tags": ["mccafe_expansion", "drive_thru"]},
        {"ticker": "SAPPHIRE", "name": "Sapphire Foods India Ltd.", "sub": "KFC & Pizza Hut (South & East India)", "tags": ["sri_lanka_operations", "dine_in_delivery"]},
    ],
    "Telecom & Tower Infrastructure": [
        {"ticker": "BHARTIARTL", "name": "Bharti Airtel Ltd.", "sub": "Telecom Services & Africa Mobility", "tags": ["arpu_tariff_hikes", "5g_monetization", "enterprise_cloud"]},
        {"ticker": "IDEA", "name": "Vodafone Idea Ltd.", "sub": "Telecom Operator", "tags": ["fundraise", "5g_rollout", "agr_dues"]},
        {"ticker": "INDUSTOWER", "name": "Indus Towers Ltd.", "sub": "Telecom Passive Tower Infrastructure", "tags": ["tenancy_ratio", "5g_small_cells"]},
    ],
    "Logistics, Ports & Marine Transportation": [
        {"ticker": "ADANIPORTS", "name": "Adani Ports and Special Economic Zone", "sub": "Commercial Ports & Multimodal Terminals", "tags": ["cargo_volume_growth", "container_transshipment", "vizhinjam_port"]},
        {"ticker": "CONCOR", "name": "Container Corp. of India", "sub": "Inland Container Depots & Rail Freight", "tags": ["dfc_double_stacking", "exim_tariffs"]},
        {"ticker": "ALLCARGO", "name": "Allcargo Logistics Ltd.", "sub": "Global LCL Consolidation & Contract Logistics", "tags": ["global_freight_rates", "red_sea_shipping"]},
        {"ticker": "BLUEDART", "name": "Blue Dart Express Ltd.", "sub": "Air Express & Parcel Courier", "tags": ["e_commerce_deliveries", "aviation_turbine_fuel"]},
        {"ticker": "DELHIVERY", "name": "Delhivery Ltd.", "sub": "Integrated Express & Supply Chain Logistics", "tags": ["truckload_automation", "network_density"]},
    ],
    "Aviation & Airlines": [
        {"ticker": "INDIGO", "name": "InterGlobe Aviation Ltd. (IndiGo)", "sub": "Low Cost Passenger Airline", "tags": ["passenger_load_factor", "atf_fuel_costs", "crude_negative", "international_routes"]},
        {"ticker": "SPICEJET", "name": "SpiceJet Ltd.", "sub": "Low Cost Carrier", "tags": ["fleet_un-grounding", "atf_prices", "crude_negative"]},
    ],
    "Hotels, Hospitality & Tourism": [
        {"ticker": "INDHOTEL", "name": "The Indian Hotels Company Ltd. (Taj)", "sub": "Luxury & Mid-market Hotels", "tags": ["revpar_expansion", "ginger_amaze", "moms_management"]},
        {"ticker": "LEMONTREE", "name": "Lemon Tree Hotels Ltd.", "sub": "Mid-scale Hospitality Network", "tags": ["aurika_mumbai", "business_travel_occupancy"]},
        {"ticker": "EIHOTEL", "name": "EIH Ltd. (Oberoi Group)", "sub": "Luxury Hotels & Resorts", "tags": ["ultra_luxury_leisure", "palace_properties"]},
        {"ticker": "CHALET", "name": "Chalet Hotels Ltd.", "sub": "Commercial Real Estate & High-end Hotels", "tags": ["metro_business_hotels", "airport_assets"]},
    ],
    "Real Estate & Commercial REITs": [
        {"ticker": "DLF", "name": "DLF Ltd.", "sub": "Luxury Residential & Commercial Offices", "tags": ["gurugram_super_luxury", "rental_annuity"]},
        {"ticker": "GODREJPROP", "name": "Godrej Properties Ltd.", "sub": "Pan-India Residential Developer", "tags": ["booking_pre-sales", "ncr_mumbai_bengaluru"]},
        {"ticker": "LODHA", "name": "Macrotech Developers Ltd. (Lodha)", "sub": "Residential & Logistics Parks", "tags": ["mumbai_redevelopment", "digital_infra"]},
        {"ticker": "OBEROIRLTY", "name": "Oberoi Realty Ltd.", "sub": "Premium Residential & Malls", "tags": ["mumbai_luxury", "pokhran_thane"]},
        {"ticker": "PRESTIGE", "name": "Prestige Estates Projects Ltd.", "sub": "Residential, Office & Retail", "tags": ["bengaluru_mumbai_expansion", "hospitality"]},
        {"ticker": "BRIGADE", "name": "Brigade Enterprises Ltd.", "sub": "Residential & Tech Parks", "tags": ["southern_tech_corridors", "joint_ventures"]},
    ],
    "Electronics Manufacturing Services (EMS) & Tech Hardware": [
        {"ticker": "DIXON", "name": "Dixon Technologies (India) Ltd.", "sub": "EMS for Smartphones, TVs & Appliances", "tags": ["pli_telecom_smartphones", "iscon_lighting", "import_substitution"]},
        {"ticker": "KAYNES", "name": "Kaynes Technology India Ltd.", "sub": "Advanced Electronics & OSAT Semiconductor", "tags": ["semiconductor_packaging", "aerospace_electronics"]},
        {"ticker": "SYRMA", "name": "Syrma SGS Technology Ltd.", "sub": "Precision Electronics & RFID", "tags": ["medical_electronics", "industrial_pcb"]},
        {"ticker": "AMBER", "name": "Amber Enterprises India Ltd.", "sub": "Air Conditioner OEM & Electronics Sub-assemblies", "tags": ["room_ac_components", "sidwal_rail_ac"]},
        {"ticker": "MOSCHIP", "name": "MosChip Technologies Ltd.", "sub": "Semiconductor Design Services & ASIC", "tags": ["chip_design", "india_semiconductor_mission"]},
    ],
    "Textiles & Apparel": [
        {"ticker": "PAGEIND", "name": "Page Industries Ltd. (Jockey)", "sub": "Innerwear, Athleisure & Socks", "tags": ["raw_cotton_costs", "athleisure_penetration"]},
        {"ticker": "KPRMILL", "name": "K.P.R. Mill Ltd.", "sub": "Yarn, Knitted Fabric & Garments", "tags": ["garment_exports_us_eu", "ethanol_sugar"]},
        {"ticker": "TRIDENT", "name": "Trident Ltd.", "sub": "Home Textiles (Bed & Bath Linen) & Paper", "tags": ["us_big_box_retail", "cotton_availability"]},
        {"ticker": "WELSPUNLIV", "name": "Welspun Living Ltd.", "sub": "Home Textiles & Advanced Flooring", "tags": ["us_housing_linens", "innovation"]},
    ],
    "Fertilizers & Agricultural Inputs": [
        {"ticker": "FACT", "name": "Fertilisers & Chemicals Travancore", "sub": "Complex Fertilizers & Caprolactam", "tags": ["fertilizer_subsidy", "ammonium_phosphate"]},
        {"ticker": "RCF", "name": "Rashtriya Chemicals & Fertilizers", "sub": "Urea & Industrial Chemicals", "tags": ["gas_pooling_subsidy", "trombay_expansion"]},
        {"ticker": "GNFC", "name": "Gujarat Narmada Valley Fert. & Chem", "sub": "Urea, Acetic Acid & TDI", "tags": ["tdi_chemical_prices", "industrial_chemicals"]},
        {"ticker": "CHAMBLFERT", "name": "Chambal Fertilisers and Chemicals", "sub": "Urea & Crop Protection Trading", "tags": ["gadepan_plants", "monsoon_sowing"]},
    ],
}


class StockUniverseRegistry:
    """
    Authoritative Universe Registry for Sector, Sub-industry, Keyword,
    and Macro Sensitivity (Beneficiaries vs Losers) Mapping across 33 NSE Sectors.
    """

    @classmethod
    def get_stocks_for_sectors(cls, sector_names: List[str]) -> List[Dict[str, Any]]:
        matched: List[Dict[str, Any]] = []
        seen_tickers: Set[str] = set()

        for query_sec in sector_names:
            clean_query = query_sec.lower().strip()
            if not clean_query:
                continue
            for sector, stock_list in NSE_SECTOR_UNIVERSE.items():
                if (
                    clean_query in sector.lower()
                    or sector.lower() in clean_query
                    or any(w in sector.lower() for w in clean_query.split() if len(w) > 3)
                ):
                    for stock in stock_list:
                        t = stock["ticker"]
                        if t not in seen_tickers:
                            seen_tickers.add(t)
                            matched.append({**stock, "sector": sector})

        return matched

    @classmethod
    def find_candidates_from_keywords(cls, keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Matches keywords (e.g. ['steel', 'infra', 'banking', 'crude', 'pli', 'railway']) against the universe.
        """
        matched: List[Dict[str, Any]] = []
        seen_tickers: Set[str] = set()

        for kw in keywords:
            clean_kw = kw.lower().strip()
            if not clean_kw or len(clean_kw) < 2:
                continue

            for sector, stock_list in NSE_SECTOR_UNIVERSE.items():
                sector_match = clean_kw in sector.lower()

                for stock in stock_list:
                    ticker = stock["ticker"]
                    name = stock["name"].lower()
                    sub = stock["sub"].lower()
                    tags = [t.lower() for t in stock.get("tags", [])]

                    if (
                        sector_match
                        or clean_kw == ticker.lower()
                        or clean_kw in name
                        or clean_kw in sub
                        or any(clean_kw in tag for tag in tags)
                    ):
                        if ticker not in seen_tickers:
                            seen_tickers.add(ticker)
                            matched.append({**stock, "sector": sector})

        return matched

    @classmethod
    def find_beneficiaries_and_losers(
        cls,
        event_type: str,
        keywords: List[str],
        direction: str = "POSITIVE"
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Deterministically maps macroeconomic / commodity / sectoral dynamics to both
        potential beneficiaries and potential losers across the universe.
        """
        beneficiaries: List[Dict[str, Any]] = []
        losers: List[Dict[str, Any]] = []
        all_kw_text = (" ".join(keywords) + " " + event_type).lower()

        # 1. Crude Oil dynamics
        if any(w in all_kw_text for w in ["crude", "brent", "oil price", "petroleum", "opec"]):
            if "fall" in all_kw_text or "drop" in all_kw_text or "decline" in all_kw_text or "crash" in all_kw_text:
                # Crude falling -> Paints, Airlines, Tyres, Chemicals BENEFIT; Upstream Oil HURT
                beneficiaries.extend(cls.find_candidates_from_keywords(["INDIGO", "SPICEJET", "MRF", "APOLLOTYRE", "CEATLTD", "SRF", "AARTIIND"]))
                losers.extend(cls.find_candidates_from_keywords(["ONGC", "OIL", "RELIANCE"]))
            else:
                # Crude rising -> Upstream Oil BENEFIT; Paints, Airlines, Tyres, Chemicals HURT
                beneficiaries.extend(cls.find_candidates_from_keywords(["ONGC", "OIL", "RELIANCE"]))
                losers.extend(cls.find_candidates_from_keywords(["INDIGO", "SPICEJET", "MRF", "APOLLOTYRE", "CEATLTD", "SRF", "AARTIIND"]))

        # 2. Interest Rates & RBI Monetary Policy
        elif any(w in all_kw_text for w in ["rate cut", "repo rate cut", "rate ease", "monetary easing"]):
            # Rate cuts -> NBFCs, Real Estate, Auto, Capital Goods BENEFIT
            beneficiaries.extend(cls.find_candidates_from_keywords(["BAJFINANCE", "CHOLAFIN", "SHRIRAMFIN", "DLF", "GODREJPROP", "MARUTI", "TATAMOTORS", "M&M"]))
        elif any(w in all_kw_text for w in ["rate hike", "repo rate hike", "tightening", "inflation high"]):
            # Rate hikes -> Realty, High Debt NBFCs HURT
            losers.extend(cls.find_candidates_from_keywords(["DLF", "GODREJPROP", "BAJFINANCE", "LICHSGFIN"]))

        # 3. Government Infrastructure / Railway / Defence Capex
        elif any(w in all_kw_text for w in ["defence", "artillery", "warship", "missile", "fighter jet"]):
            beneficiaries.extend(cls.find_candidates_from_keywords(["HAL", "BEL", "BDL", "MAZDOCK", "COCHINSHIP", "SOLARINDS", "BHARATFORG"]))
        elif any(w in all_kw_text for w in ["railway", "rail", "vande bharat", "train", "track"]):
            beneficiaries.extend(cls.find_candidates_from_keywords(["IRCTC", "IRFC", "RVNL", "RAILTEL", "TITAGARH", "JUPITERWAG"]))
        elif any(w in all_kw_text for w in ["infrastructure", "highway", "construction", "capex", "epc"]):
            beneficiaries.extend(cls.find_candidates_from_keywords(["LT", "ULTRACEMCO", "AMBUJACEM", "SIEMENS", "ABB", "NCC"]))

        # 4. Electronics PLI & Semiconductor Subsidies
        elif any(w in all_kw_text for w in ["pli", "semiconductor", "electronics", "chip", "manufacturing incentive"]):
            beneficiaries.extend(cls.find_candidates_from_keywords(["DIXON", "KAYNES", "SYRMA", "AMBER", "MOSCHIP"]))

        # 5. Solar & Renewable Energy push
        elif any(w in all_kw_text for w in ["solar", "wind", "renewable", "clean energy", "green hydrogen"]):
            beneficiaries.extend(cls.find_candidates_from_keywords(["SUZLON", "INOXWIND", "BORORENEW", "TATAPOWER", "WAAREEENER", "NTPC"]))

        # 6. Fallback: Keyword search based on direction
        if not beneficiaries and direction == "POSITIVE":
            beneficiaries = cls.find_candidates_from_keywords(keywords)
        elif not losers and direction == "NEGATIVE":
            losers = cls.find_candidates_from_keywords(keywords)

        return {
            "beneficiaries": beneficiaries[:8],
            "losers": losers[:6],
        }

    @classmethod
    def get_company_meta(cls, ticker: str) -> Optional[Dict[str, Any]]:
        clean_t = ticker.strip().upper()
        for sector, stock_list in NSE_SECTOR_UNIVERSE.items():
            for stock in stock_list:
                if stock["ticker"] == clean_t:
                    return {**stock, "sector": sector}
        return None

    @classmethod
    def get_all_sectors(cls) -> List[str]:
        return list(NSE_SECTOR_UNIVERSE.keys())

    @classmethod
    def get_all_tickers(cls) -> List[str]:
        all_t: List[str] = []
        for stock_list in NSE_SECTOR_UNIVERSE.values():
            for stock in stock_list:
                all_t.append(stock["ticker"])
        return all_t


import marimo

__generated_with = "0.16.5"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _(mo):
    mo.md(
        r"""
    # 🚂 BNSF Rail Network Analysis

    Interactive analysis of the BNSF (Burlington Northern Santa Fe) Railway network across North America.
    """
    )
    return


@app.cell
def _():
    import json
    import pandas as pd
    import altair as alt
    return alt, json, pd


@app.cell
def _(json):
    import requests
    
    # Load BNSF rail data from GitHub (works in WASM without local files)
    raw_url = 'https://raw.githubusercontent.com/gramjos/data/main/bnsf_rail.geojson'
    
    print("📥 Downloading BNSF rail data from GitHub...")
    
    try:
        # Fetch data from GitHub
        response = requests.get(raw_url, timeout=30)
        
        if response.status_code == 200:
            geojson_data = response.json()
            features = geojson_data['features']
            print(f"✅ Loaded {len(features):,} rail features from GitHub")
        else:
            print(f"❌ Failed to download. Status code: {response.status_code}")
            geojson_data = {'type': 'FeatureCollection', 'features': []}
            features = []
    
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        geojson_data = {'type': 'FeatureCollection', 'features': []}
        features = []
    
    return features, geojson_data


@app.cell
def _(features, pd):
    # Convert to DataFrame for analysis
    rail_df = pd.DataFrame([f['properties'] for f in features])

    # Display basic info
    rail_df.head()
    return (rail_df,)


@app.cell
def _(mo):
    mo.md(r"""## 📊 Cumulative Miles by State""")
    return


@app.cell
def _(alt, rail_df):
    # Calculate total miles by state
    if 'STATEAB' in rail_df.columns and 'MILES' in rail_df.columns:
        # Group by state and sum miles
        state_miles = rail_df.groupby('STATEAB')['MILES'].sum().reset_index()
        state_miles.columns = ['State', 'Total Miles']
        
        # Sort by total miles and get top 20
        state_miles = state_miles.sort_values('Total Miles', ascending=False).head(20)
        
        # Create bar chart
        miles_chart = alt.Chart(state_miles).mark_bar().encode(
            x=alt.X('Total Miles:Q', title='Cumulative Miles'),
            y=alt.Y('State:N', sort='-x', title='State'),
            color=alt.Color('Total Miles:Q', scale=alt.Scale(scheme='viridis')),
            tooltip=['State', alt.Tooltip('Total Miles:Q', format='.2f')]
        ).properties(
            width=700,
            height=500,
            title='Top 20 States by Total Rail Miles'
        )
        
        miles_chart
    else:
        mo.md("⚠️ MILES or STATEAB column not found in dataset")
    return


@app.cell
def _(mo):
    mo.md(
        r"""
        ## � Interactive Histogram
        
        Use the controls below to explore different variables and adjust the histogram bins:
        """
    )
    return


@app.cell
def _(mo, rail_df):
    # Get numeric columns for histogram
    numeric_cols = rail_df.select_dtypes(include=['float64', 'int64']).columns.tolist()
    
    if numeric_cols:
        # Create variable selector
        variable_selector = mo.ui.dropdown(
            options=numeric_cols,
            value=numeric_cols[0] if numeric_cols else None,
            label='Select Variable:'
        )
        
        # Create bin slider
        bin_slider = mo.ui.slider(
            start=5,
            stop=100,
            step=5,
            value=20,
            label='Number of Bins:'
        )
        
        mo.hstack([variable_selector, bin_slider])
    else:
        mo.md("⚠️ No numeric columns found for histogram")
        variable_selector = None
        bin_slider = None
        
    return variable_selector, bin_slider
    return


@app.cell
def _(alt, bin_slider, mo, rail_df, variable_selector):
    # Generate histogram based on selections
    if variable_selector is not None and bin_slider is not None:
        selected_var = variable_selector.value
        num_bins = bin_slider.value
        
        # Filter out null values
        data_filtered = rail_df[rail_df[selected_var].notna()][[selected_var]]
        
        # Create histogram
        histogram = alt.Chart(data_filtered).mark_bar().encode(
            x=alt.X(f'{selected_var}:Q', 
                   bin=alt.Bin(maxbins=num_bins), 
                   title=selected_var),
            y=alt.Y('count()', title='Frequency'),
            color=alt.value('steelblue'),
            tooltip=[
                alt.Tooltip(f'{selected_var}:Q', bin=alt.Bin(maxbins=num_bins), title='Range'),
                alt.Tooltip('count()', title='Count')
            ]
        ).properties(
            width=700,
            height=400,
            title=f'Distribution of {selected_var} ({num_bins} bins)'
        )
        
        histogram
    else:
        mo.md("⚠️ Unable to create histogram")
    return


@app.cell
def _(mo):
    mo.md(
        r"""
    ---

    💡 **Tip**: Use the map view to see the geographic distribution of these rail segments!
    """
    )
    return


if __name__ == "__main__":
    app.run()

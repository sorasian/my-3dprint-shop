# main.py (Multi-file version)

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io, datetime, traceback, json
from typing import List

# ReportLab Imports
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# STL Processing Imports
from stl import mesh
import numpy

# CORS Middleware Import
from fastapi.middleware.cors import CORSMiddleware

# --- Font Registration ---
try:
    pdfmetrics.registerFont(TTFont('Prompt', 'fonts/Prompt-Regular.ttf'))
    pdfmetrics.registerFont(TTFont('Prompt-Bold', 'fonts/Prompt-Bold.ttf'))
except Exception as e:
    print(f"Warning: Could not load Prompt font. Error: {e}")

# --- FastAPI App Setup ---
app = FastAPI(title="CraftLabs API", version="4.0.0")
origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Pydantic Models for Multi-file ---
class PrintOptions(BaseModel):
    material: str
    color: str
    infill: int
    layer_height: float
    scale: float

class EstimationItem(BaseModel):
    filename: str
    weight: float
    price: float
    options: PrintOptions

class QuotationData(BaseModel):
    items: List[EstimationItem]
    total_weight: float
    total_price: float

# --- Material Data ---
MATERIALS = {
    "PLA": {"price": 5.0, "density": 1.24},
    "PETG": {"price": 5.5, "density": 1.27},
    "PLA-PRO": {"price": 7.0, "density": 1.24},
    "PLA-CF": {"price": 10.0, "density": 1.30},
    "TPU": {"price": 10.0, "density": 1.21},
    "ABS": {"price": 12.0, "density": 1.04},
    "RESIN": {"price": 15.0, "density": 1.18},
}

# --- PDF Generation Function for Multi-file ---
def create_multi_item_quotation(data: QuotationData):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='NormalRight', alignment=TA_RIGHT, fontName='Prompt'))
    styles.add(ParagraphStyle(name='BoldRight', alignment=TA_RIGHT, fontName='Prompt-Bold'))
    styles.add(ParagraphStyle(name='NormalCenter', alignment=TA_CENTER, fontName='Prompt'))
    styles['Title'].fontName = 'Prompt-Bold'; styles['Title'].fontSize = 20; styles['Title'].alignment = TA_CENTER; styles['Title'].spaceAfter = 14
    styles['Normal'].fontName = 'Prompt'; styles['Normal'].fontSize = 9; styles['Normal'].leading = 12

    story = []
    
    # Header & Info
    try:
        logo = Image('logo.png', width=4*cm, height=2*cm); logo.hAlign = 'LEFT'
    except:
        logo = Paragraph("CRAFT LABS", styles['Title'])
    header_text_style = ParagraphStyle(name='HeaderText', parent=styles['Normal'], spaceBefore=0, spaceAfter=0)
    company_info = [Paragraph("<b>CRAFTLABS</b>", header_text_style), Paragraph("บจก.อุดมสุขเวิลด์ (เลขทะเบียนนิติบุคคล : 0105568011779)", header_text_style), Paragraph("190 ซอย วงศ์สว่าง 11 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพมหานคร 10800", header_text_style), Paragraph("Tel : 089-937-9279 | Line@ : @craftlabs", header_text_style)]
    header_table = Table([[logo, company_info]], colWidths=[5*cm, 12*cm]); header_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')])); story.append(header_table)
    story.append(Spacer(1, 1*cm)); story.append(Paragraph("ใบเสนอราคา / Quotation", styles['Title']))
    quote_no = f"QT{datetime.date.today().strftime('%y%m%d')}-001"; date_str = datetime.date.today().strftime('%d/%m/%Y')
    info_data = [[Paragraph("<b>Company:</b>", styles['Normal']), '', Paragraph("<b>Quote No.:</b>", styles['Normal']), Paragraph(quote_no, styles['Normal'])],[Paragraph("<b>ATTN:</b>", styles['Normal']), '', Paragraph("<b>Date:</b>", styles['Normal']), Paragraph(date_str, styles['Normal'])]]
    info_table = Table(info_data, colWidths=[2.5*cm, 7*cm, 2.5*cm, 5*cm]); story.append(info_table); story.append(Spacer(1, 0.7*cm))
    
    # Items Table
    table_header = [Paragraph("<b>ITEM</b>", styles['NormalCenter']), Paragraph("<b>DESCRIPTION</b>", styles['NormalCenter']), Paragraph("<b>WEIGHT (g)</b>", styles['NormalCenter']), Paragraph("<b>PRICE (THB)</b>", styles['NormalCenter'])]
    table_data = [table_header]
    for i, item in enumerate(data.items):
        desc = (f"<b>{item.filename}</b><br/>"
                f"Mat: {item.options.material}, Color: {item.options.color}<br/>"
                f"Layer: {item.options.layer_height:.2f}mm, Infill: {item.options.infill}%, Scale: {item.options.scale:.2f}x")
        row = [str(i + 1), Paragraph(desc, styles['Normal']), Paragraph(f"{item.weight:.2f}", styles['NormalRight']), Paragraph(f"{item.price:,.2f}", styles['NormalRight'])]
        table_data.append(row)

    items_table = Table(table_data, colWidths=[1.5*cm, 10*cm, 2.5*cm, 3*cm])
    items_table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), HexColor("#F9D423")), ('TEXTCOLOR', (0,0), (-1,0), black), ('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('FONTNAME', (0,0), (-1,0), 'Prompt-Bold'), ('BOTTOMPADDING', (0,0), (-1,0), 8), ('TOPPADDING', (0,1), (-1,-1), 6), ('GRID', (0,0), (-1,-1), 1, black)]))
    story.append(items_table)
    story.append(Spacer(1, 1*cm))
    
    # Totals
    totals_data = [['', 'รวมน้ำหนัก (Total Weight)', Paragraph(f"{data.total_weight:,.2f} g", styles['NormalRight'])], ['', 'รวมทั้งสิ้น (Subtotal)', Paragraph(f"{data.total_price:,.2f}", styles['NormalRight'])], ['', Paragraph("<b>ราคารวมภาษี (Grand Total)</b>", styles['BoldRight']), Paragraph(f"<b>{data.total_price:,.2f}</b>", styles['BoldRight'])]]
    totals_table = Table(totals_data, colWidths=[10*cm, 4*cm, 3*cm]); totals_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 0)])); story.append(totals_table)
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# --- API Endpoints ---
@app.post("/estimate_multi/")
async def estimate_multi_files(files: List[UploadFile] = File(...), options_json: str = Form(...)):
    try:
        all_options = json.loads(options_json)
        results = []
        total_weight = 0.0
        total_price = 0.0

        if len(files) != len(all_options):
            raise HTTPException(status_code=400, detail="Mismatch between number of files and options.")

        for i, file in enumerate(files):
            if not file.filename.lower().endswith(".stl"): continue
            
            opts = PrintOptions(**all_options[i])
            
            contents = await file.read()
            stl_obj = io.BytesIO(contents)
            stl_mesh_data = mesh.Mesh.from_file('', fh=stl_obj)
            
            volume_mm3, _, _ = stl_mesh_data.get_mass_properties()
            scaled_volume_mm3 = volume_mm3 * (opts.scale ** 3)
            
            if scaled_volume_mm3 == 0: continue

            volume_cm3 = scaled_volume_mm3 / 1000.0
            material_info = MATERIALS[opts.material]
            weight = volume_cm3 * material_info["density"]
            price = weight * material_info["price"]

            results.append({ "filename": file.filename, "weight": weight, "price": price, "options": opts.dict() })
            total_weight += weight
            total_price += price

        return {"items": results, "total_weight": total_weight, "total_price": total_price}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.post("/generate_quotation_multi/")
async def generate_quotation_multi(data: QuotationData):
    try:
        pdf_buffer = create_multi_item_quotation(data)
        filename = f"Quotation-Multi-Item.pdf"
        headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
        return StreamingResponse(pdf_buffer, media_type='application/pdf', headers=headers)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Could not generate PDF: {e}")

@app.get("/")
def read_root():
    return {"status": "CraftLabs API is running!"}